const payos = require('../config/payos');
const { User, WalletTransaction, WalletTopup, sequelize } = require('../models');
const { notify } = require('../services/notificationService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MIN_TOPUP = 10000;

// GET /wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'fullName', 'walletBalance'] });
    const transactions = await WalletTransaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json({ balance: parseFloat(user.walletBalance || 0), transactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /wallet/topup  — create PayOS link for topping up
exports.createTopup = async (req, res) => {
  try {
    const amount = Math.round(Number(req.body.amount));
    if (!amount || amount < MIN_TOPUP) {
      return res.status(400).json({ message: `Số tiền nạp tối thiểu là ${MIN_TOPUP.toLocaleString()}đ` });
    }

    // orderCode: timestamp-based so it won't collide with order IDs (which are small ints)
    const orderCode = Date.now();

    const topup = await WalletTopup.create({
      userId: req.user.id,
      amount,
      orderCode,
      status: 'pending',
    });

    const returnBase = `${FRONTEND_URL}/wallet/topup/result?topupId=${topup.id}`;

    try {
      const link = await payos.createPaymentLink({
        orderCode,
        amount,
        description: `NAP VI ${req.user.id}`.slice(0, 25),
        items: [{ name: 'Nạp ví YarnShop', quantity: 1, price: amount }],
        returnUrl: returnBase,
        cancelUrl: `${returnBase}&cancelled=true`,
        expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
        buyerName: req.user.fullName,
      });
      await topup.update({ checkoutUrl: link.checkoutUrl });
      return res.json({ checkoutUrl: link.checkoutUrl, topupId: topup.id });
    } catch (payosErr) {
      // Fallback to simulate
      console.warn('PayOS unavailable for topup, using simulate:', payosErr?.response?.data?.desc || payosErr.message);
      const simulateUrl = `${FRONTEND_URL}/payment/simulate?topupId=${topup.id}&amount=${amount}`;
      await topup.update({ checkoutUrl: simulateUrl });
      return res.json({ checkoutUrl: simulateUrl, topupId: topup.id, simulated: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /wallet/topup/simulate/:topupId  — dev/fallback simulated topup confirm
exports.simulateTopup = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const topup = await WalletTopup.findOne({
      where: { id: req.params.topupId, userId: req.user.id },
      transaction: t,
    });
    if (!topup) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy giao dịch' }); }
    if (topup.status !== 'pending') { await t.rollback(); return res.status(400).json({ message: 'Giao dịch đã xử lý' }); }

    const user = await User.findByPk(req.user.id, { transaction: t });
    const balanceBefore = parseFloat(user.walletBalance || 0);
    const amount = parseFloat(topup.amount);
    const balanceAfter = balanceBefore + amount;

    await user.update({ walletBalance: balanceAfter }, { transaction: t });
    await WalletTransaction.create({
      userId: req.user.id, type: 'topup', amount,
      balanceBefore, balanceAfter,
      description: 'Nạp ví (mô phỏng)',
      reference: `SIM-${topup.orderCode}`,
    }, { transaction: t });
    await topup.update({ status: 'completed' }, { transaction: t });
    await t.commit();

    await notify(req.user.id, 'wallet_topup',
      'Nạp tiền thành công',
      `Đã nạp ${amount.toLocaleString('vi-VN')}đ vào ví. Số dư hiện tại: ${balanceAfter.toLocaleString('vi-VN')}đ.`,
      { amount, balanceAfter }
    );
    res.json({ success: true, newBalance: balanceAfter });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

// GET /wallet/topup/status/:topupId
exports.getTopupStatus = async (req, res) => {
  try {
    const topup = await WalletTopup.findOne({
      where: { id: req.params.topupId, userId: req.user.id },
    });
    if (!topup) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });

    // Try live PayOS check if still pending
    if (topup.status === 'pending') {
      try {
        const info = await payos.getPaymentLinkInfo(topup.orderCode);
        if (info?.status === 'PAID') {
          await creditWalletFromTopup(topup);
          await topup.reload();
        }
      } catch {}
    }

    const user = await User.findByPk(req.user.id, { attributes: ['walletBalance'] });
    res.json({ status: topup.status, amount: parseFloat(topup.amount), balance: parseFloat(user.walletBalance || 0) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Called from payment webhook when a wallet topup orderCode is detected
async function creditWalletFromTopup(topup, reference = null) {
  const t = await sequelize.transaction();
  try {
    await topup.reload({ transaction: t });
    if (topup.status !== 'pending') { await t.rollback(); return; }

    const user = await User.findByPk(topup.userId, { transaction: t });
    const balanceBefore = parseFloat(user.walletBalance || 0);
    const amount = parseFloat(topup.amount);
    const balanceAfter = balanceBefore + amount;

    await user.update({ walletBalance: balanceAfter }, { transaction: t });
    await WalletTransaction.create({
      userId: topup.userId, type: 'topup', amount,
      balanceBefore, balanceAfter,
      description: 'Nạp ví qua PayOS',
      reference: reference || String(topup.orderCode),
    }, { transaction: t });
    await topup.update({ status: 'completed' }, { transaction: t });
    await t.commit();

    await notify(topup.userId, 'wallet_topup',
      'Nạp tiền thành công',
      `Đã nạp ${amount.toLocaleString('vi-VN')}đ vào ví qua PayOS. Số dư: ${balanceAfter.toLocaleString('vi-VN')}đ.`,
      { amount, balanceAfter }
    );
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

exports.creditWalletFromTopup = creditWalletFromTopup;
