const payos = require('../config/payos');
const { Order, OrderDetail, Payment, Product, InventoryTransaction, User, WalletTransaction, WalletTopup, sequelize } = require('../models');
const { creditWalletFromTopup } = require('./wallet.controller');
const { notify, notifyByRole, checkTierUpgrade } = require('../services/notificationService');
const { calcPointsEarned } = require('../utils/loyalty');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RETURN_PAYOS_OFFSET = 5_000_000;

let returnCtrl;
const getReturnCtrl = () => {
  if (!returnCtrl) returnCtrl = require('./return.controller');
  return returnCtrl;
};

// Shared helper — marks an order as paid and decrements stock
async function confirmPayment(orderId, transactionId = null) {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, { include: [{ model: OrderDetail }], transaction: t });
    if (!order || order.status !== 'pending_payment') { await t.rollback(); return false; }

    for (const detail of order.OrderDetails) {
      const product = await Product.findByPk(detail.productId, { transaction: t });
      if (product) {
        const decBy = Math.min(detail.quantity, product.stock);
        if (decBy > 0) await product.decrement('stock', { by: decBy, transaction: t });
        await product.increment('sold', { by: detail.quantity, transaction: t });
        await InventoryTransaction.create({
          productId: product.id, type: 'sale', quantity: -detail.quantity,
          referenceId: order.id, referenceType: 'order', performedBy: order.userId
        }, { transaction: t });
      }
    }
    if (order.userId) {
      const earned = order.pointsEarned ?? calcPointsEarned(parseFloat(order.total));
      if (earned > 0) {
        const user = await User.findByPk(order.userId, { transaction: t });
        if (user) await user.increment('loyaltyPoints', { by: earned, transaction: t });
      }
    }
    await order.update({ status: 'paid' }, { transaction: t });
    await Payment.update(
      { status: 'paid', paidAt: new Date(), transactionId },
      { where: { orderId: order.id }, transaction: t }
    );

    // Record PayOS payment in wallet transaction history (informational, balance unchanged)
    if (order.userId) {
      const buyer = await User.findByPk(order.userId, { transaction: t });
      const currentBalance = parseFloat(buyer?.walletBalance || 0);
      await WalletTransaction.create({
        userId: order.userId,
        type: 'payment',
        amount: -parseFloat(order.total),
        balanceBefore: currentBalance,
        balanceAfter: currentBalance,
        orderId: order.id,
        description: `Thanh toán đơn hàng ${order.orderCode} qua PayOS`,
        reference: transactionId || `PAYOS-${order.id}`,
      }, { transaction: t });
    }

    await t.commit();

    // Notifications (after commit so they don't block the transaction)
    if (order.userId) {
      await notify(order.userId, 'order_paid',
        'Thanh toán thành công',
        `Đơn hàng ${order.orderCode} đã được thanh toán. Đang chờ nhân viên xác nhận.`,
        { orderId: order.id, orderCode: order.orderCode }
      );
    }
    await notifyByRole('staff', 'order_paid',
      'Đơn hàng mới cần xử lý',
      `Đơn hàng ${order.orderCode} vừa được thanh toán. Vui lòng xác nhận.`,
      { orderId: order.id, orderCode: order.orderCode }
    );
    if (order.userId) {
      await checkTierUpgrade(order.userId, order.id, order.total);
    }
    return true;
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

// POST /api/payment/create-link/:orderId
exports.createPaymentLink = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [{ model: OrderDetail }]
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending_payment') return res.status(400).json({ message: 'Đơn hàng không ở trạng thái chờ thanh toán' });

    const payment = await Payment.findOne({ where: { orderId: order.id } });
    if (payment?.status === 'paid') return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });

    const items = order.OrderDetails.map(d => ({
      name: d.productName.slice(0, 50),
      quantity: d.quantity,
      price: Math.round(parseFloat(d.unitPrice))
    }));

    try {
      const link = await payos.createPaymentLink({
        orderCode: order.id,
        amount: Math.round(parseFloat(order.total)),
        description: `DH${order.id}`.slice(0, 25),
        items,
        returnUrl: `${FRONTEND_URL}/payment/result?orderId=${order.id}`,
        cancelUrl: `${FRONTEND_URL}/payment/result?orderId=${order.id}&cancelled=true`,
        expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
        buyerName: order.shippingName,
        buyerPhone: order.shippingPhone,
      });
      return res.json({ checkoutUrl: link.checkoutUrl, paymentLinkId: link.paymentLinkId });
    } catch (payosErr) {
      // PayOS account not configured — fall back to simulated payment page
      console.warn('PayOS unavailable, using simulate flow:', payosErr?.response?.data?.desc || payosErr.message);
      const simulateUrl = `${FRONTEND_URL}/payment/simulate?orderId=${order.id}&amount=${Math.round(parseFloat(order.total))}&orderCode=${order.orderCode}`;
      return res.json({ checkoutUrl: simulateUrl, simulated: true });
    }
  } catch (err) {
    console.error('createPaymentLink error:', err.message);
    res.status(500).json({ message: err.message || 'Không thể tạo liên kết thanh toán' });
  }
};

// POST /api/payment/simulate-pay/:orderId  — dev/fallback simulated payment
exports.simulatePay = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending_payment') return res.status(400).json({ message: 'Đơn hàng không ở trạng thái chờ thanh toán' });

    await confirmPayment(order.id, `SIM-${Date.now()}`);
    res.json({ success: true, message: 'Thanh toán mô phỏng thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payment/webhook  (called by PayOS servers)
exports.handleWebhook = async (req, res) => {
  try {
    let webhookData;
    try {
      webhookData = payos.verifyWebhookData(req.body);
    } catch (sigErr) {
      console.error('Webhook signature mismatch:', sigErr.message);
      return res.json({ success: false, message: 'Invalid signature' });
    }

    const isPaid = webhookData.code === '00';
    const orderCode = Number(webhookData.orderCode);

    // Check if this is a wallet topup (large orderCode from Date.now())
    const topup = await WalletTopup.findOne({ where: { orderCode } });
    if (topup) {
      if (isPaid) await creditWalletFromTopup(topup, webhookData.reference);
      else await topup.update({ status: 'failed' });
      return res.json({ success: true });
    }

    // Return payment (orderCode = returnId + RETURN_PAYOS_OFFSET)
    if (orderCode > RETURN_PAYOS_OFFSET && orderCode < 1_000_000_000) {
      const returnId = orderCode - RETURN_PAYOS_OFFSET;
      const ctrl = getReturnCtrl();
      if (isPaid) await ctrl.confirmReturnPayment(returnId, webhookData.reference);
      else await ctrl.cancelReturnPayment(returnId);
      return res.json({ success: true });
    }

    // Otherwise treat as order payment
    const orderId = orderCode;
    if (!isPaid) {
      const order = await Order.findByPk(orderId);
      if (order && order.status === 'pending_payment') {
        await order.update({ status: 'cancelled', cancelledReason: 'Thanh toán thất bại hoặc bị hủy' });
        await Payment.update({ status: 'failed' }, { where: { orderId } });
      }
      return res.json({ success: true });
    }

    await confirmPayment(orderId, webhookData.reference);
    res.json({ success: true });
  } catch (err) {
    console.error('PayOS webhook error:', err.message);
    res.json({ success: false, message: err.message });
  }
};

// GET /api/payment/status/:orderId
exports.getPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, userId: req.user.id },
      include: [{ model: Payment }]
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (order.status === 'pending_payment') {
      try {
        const info = await payos.getPaymentLinkInfo(order.id);
        if (info?.status === 'PAID') {
          await confirmPayment(order.id);
          await order.reload({ include: [{ model: Payment }] });
        }
      } catch {}
    }

    res.json({
      orderId: order.id, orderCode: order.orderCode,
      status: order.status, paymentStatus: order.Payment?.status, total: order.total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payment/cancel-link/:orderId
exports.cancelPaymentLink = async (req, res) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.status !== 'pending_payment') return res.status(400).json({ message: 'Không thể hủy đơn ở trạng thái này' });

    try { await payos.cancelPaymentLink(order.id, 'Khách hàng hủy trước khi thanh toán'); } catch {}

    await order.update({ status: 'cancelled', cancelledReason: 'Khách hàng hủy trước khi thanh toán' });
    await Payment.update({ status: 'cancelled' }, { where: { orderId: order.id } });

    res.json({ message: 'Đã hủy đơn hàng' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
