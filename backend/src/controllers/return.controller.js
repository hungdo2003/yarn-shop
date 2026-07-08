const payos = require('../config/payos');
const { ReturnRequest, Order, OrderDetail, Product, InventoryTransaction, User, WalletTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const { notify } = require('../services/notificationService');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RETURN_PAYOS_OFFSET = 5_000_000;

const generateCode = () => 'RET' + Date.now().toString().slice(-8);

const EXCHANGE_INCLUDE = [
  { model: Order, attributes: ['id', 'orderCode', 'total', 'createdAt', 'userId'] },
  { model: User, attributes: ['fullName', 'email', 'phone'] },
  { model: Product, as: 'ExchangeProduct', attributes: ['id', 'name', 'price', 'salePrice', 'thumbnailImage'], required: false },
];

// ── Wallet helpers ────────────────────────────────────────────────────────────

async function creditWallet(userId, amount, description, reference, t) {
  const user = await User.findByPk(userId, { transaction: t });
  const balanceBefore = parseFloat(user.walletBalance || 0);
  const balanceAfter = balanceBefore + amount;
  await user.update({ walletBalance: balanceAfter }, { transaction: t });
  await WalletTransaction.create({
    userId, type: 'refund', amount, balanceBefore, balanceAfter, description, reference,
  }, { transaction: t });
  return balanceAfter;
}

async function debitWallet(userId, amount, description, reference, t) {
  const user = await User.findByPk(userId, { transaction: t });
  const balanceBefore = parseFloat(user.walletBalance || 0);
  if (balanceBefore < amount) throw new Error('Số dư ví không đủ để thanh toán');
  const balanceAfter = balanceBefore - amount;
  await user.update({ walletBalance: balanceAfter }, { transaction: t });
  await WalletTransaction.create({
    userId, type: 'payment', amount, balanceBefore, balanceAfter, description, reference,
  }, { transaction: t });
  return balanceAfter;
}

// ── Stock helpers ─────────────────────────────────────────────────────────────

async function reserveExchangeStock(productId, qty, returnId, userId, t) {
  await Product.decrement('stock', { by: qty, where: { id: productId }, transaction: t });
  await InventoryTransaction.create({
    productId, type: 'reserved', quantity: -qty,
    referenceId: returnId, referenceType: 'return', performedBy: userId,
  }, { transaction: t });
}

async function releaseExchangeStock(productId, qty, returnId, userId, t) {
  await Product.increment('stock', { by: qty, where: { id: productId }, transaction: t });
  await InventoryTransaction.create({
    productId, type: 'return', quantity: qty,
    referenceId: returnId, referenceType: 'return', performedBy: userId,
  }, { transaction: t });
}

async function restoreOrderStock(orderId, returnId, userId, t) {
  const details = await OrderDetail.findAll({ where: { orderId }, transaction: t });
  for (const d of details) {
    await Product.increment('stock', { by: d.quantity, where: { id: d.productId }, transaction: t });
    await InventoryTransaction.create({
      productId: d.productId, type: 'return', quantity: d.quantity,
      referenceId: returnId, referenceType: 'return', performedBy: userId,
    }, { transaction: t });
  }
}

// ── Customer: create request ──────────────────────────────────────────────────

exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { orderId, type, reason, customerNote, exchangeProductId, exchangeProductQty = 1 } = req.body;

    const order = await Order.findOne({
      where: { id: orderId, userId: req.user.id, status: 'delivered' }, transaction: t,
    });
    if (!order) { await t.rollback(); return res.status(404).json({ message: 'Chỉ được đổi/trả đơn hàng đã giao thành công' }); }

    const existing = await ReturnRequest.findOne({
      where: { orderId, status: { [Op.notIn]: ['rejected'] } }, transaction: t,
    });
    if (existing) { await t.rollback(); return res.status(400).json({ message: 'Đơn hàng này đã có yêu cầu đổi/trả đang xử lý' }); }

    let priceDiff = null;
    if (type === 'exchange') {
      if (!exchangeProductId) { await t.rollback(); return res.status(400).json({ message: 'Vui lòng chọn sản phẩm muốn đổi' }); }
      const newProd = await Product.findOne({ where: { id: exchangeProductId, status: 'active' }, transaction: t });
      if (!newProd) { await t.rollback(); return res.status(404).json({ message: 'Sản phẩm đổi không tồn tại' }); }
      if (newProd.stock < parseInt(exchangeProductQty)) {
        await t.rollback(); return res.status(400).json({ message: 'Sản phẩm không đủ số lượng trong kho' });
      }
      const newPrice = parseFloat(newProd.salePrice || newProd.price) * parseInt(exchangeProductQty);
      priceDiff = +(newPrice - parseFloat(order.total)).toFixed(2);
    }

    const images = req.files?.map(f => '/uploads/returns/' + f.filename) || [];
    const code = generateCode();
    const needsPayment = type === 'exchange' && priceDiff > 0;
    const status = needsPayment ? 'pending_payment' : 'pending';

    const request = await ReturnRequest.create({
      code, orderId, userId: req.user.id,
      type, reason, customerNote, images,
      exchangeProductId: type === 'exchange' ? parseInt(exchangeProductId) : null,
      exchangeProductQty: type === 'exchange' ? parseInt(exchangeProductQty) : null,
      priceDiff, status,
      stockReservedAt: type === 'exchange' ? new Date() : null,
    }, { transaction: t });

    if (type === 'exchange') {
      await reserveExchangeStock(parseInt(exchangeProductId), parseInt(exchangeProductQty), request.id, req.user.id, t);
    }

    await t.commit();
    return res.status(201).json({ ...request.toJSON(), needsPayment });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

// ── Customer: pay via wallet ──────────────────────────────────────────────────

exports.payWallet = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const request = await ReturnRequest.findOne({
      where: { id: req.params.id, userId: req.user.id, status: 'pending_payment', type: 'exchange' },
      transaction: t,
    });
    if (!request) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy yêu cầu' }); }

    const amount = parseFloat(request.priceDiff);
    const balanceAfter = await debitWallet(req.user.id, amount, `Thanh toán đổi hàng ${request.code}`, request.code, t);
    await request.update({ status: 'pending', extraPaidAt: new Date() }, { transaction: t });
    await t.commit();

    await notify(req.user.id, 'wallet_payment', 'Thanh toán đổi hàng thành công',
      `Đã trừ ${amount.toLocaleString('vi-VN')}đ từ ví. Số dư còn lại: ${balanceAfter.toLocaleString('vi-VN')}đ. Shop sẽ xét duyệt sớm!`,
      { returnId: request.id, amount, balanceAfter });
    res.json({ success: true });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ message: err.message });
  }
};

// ── Customer: pay via PayOS ───────────────────────────────────────────────────

exports.payPayos = async (req, res) => {
  try {
    const request = await ReturnRequest.findOne({
      where: { id: req.params.id, userId: req.user.id, status: 'pending_payment', type: 'exchange' },
    });
    if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });

    const orderCode = request.id + RETURN_PAYOS_OFFSET;
    const amount = Math.round(parseFloat(request.priceDiff));

    try {
      const link = await payos.createPaymentLink({
        orderCode,
        amount,
        description: `DOI${request.id}`.slice(0, 25),
        items: [{ name: 'Thanh toan doi hang', quantity: 1, price: amount }],
        returnUrl: `${FRONTEND_URL}/returns?returnId=${request.id}&paymentStatus=success`,
        cancelUrl: `${FRONTEND_URL}/returns?returnId=${request.id}&paymentStatus=cancelled`,
        expiredAt: Math.floor(Date.now() / 1000) + 15 * 60,
      });
      res.json({ checkoutUrl: link.checkoutUrl });
    } catch {
      // Dev fallback: simulate success immediately
      const simulateUrl = `${FRONTEND_URL}/returns?returnId=${request.id}&paymentStatus=success&simulated=true`;
      res.json({ checkoutUrl: simulateUrl, simulated: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Shared: confirm payment (called by PayOS webhook) ─────────────────────────

exports.confirmReturnPayment = async (returnId, reference) => {
  const t = await sequelize.transaction();
  try {
    const request = await ReturnRequest.findByPk(returnId, { transaction: t });
    if (!request || request.status !== 'pending_payment') { await t.rollback(); return; }
    await request.update({ status: 'pending', extraPaidAt: new Date() }, { transaction: t });
    await t.commit();
    await notify(request.userId, 'system', 'Thanh toán đổi hàng thành công',
      `Đã nhận thanh toán cho yêu cầu đổi hàng ${request.code}. Shop sẽ xét duyệt sớm!`,
      { returnId: request.id });
  } catch (err) {
    await t.rollback();
    console.error('confirmReturnPayment error:', err.message);
  }
};

// ── Shared: cancel pending payment (called by PayOS webhook on failure) ───────

exports.cancelReturnPayment = async (returnId) => {
  const t = await sequelize.transaction();
  try {
    const request = await ReturnRequest.findByPk(returnId, { transaction: t });
    if (!request || request.status !== 'pending_payment') { await t.rollback(); return; }
    if (request.stockReservedAt) {
      await releaseExchangeStock(request.exchangeProductId, request.exchangeProductQty, request.id, request.userId, t);
    }
    await request.update({ status: 'rejected', staffNote: 'Thanh toán thất bại hoặc bị hủy' }, { transaction: t });
    await t.commit();
    await notify(request.userId, 'order_cancelled', 'Thanh toán đổi hàng thất bại',
      `Yêu cầu đổi hàng ${request.code} đã bị hủy do thanh toán không thành công.`,
      { returnId: request.id });
  } catch (err) {
    await t.rollback();
    console.error('cancelReturnPayment error:', err.message);
  }
};

// ── Customer: get own requests ────────────────────────────────────────────────

exports.getMyRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 5 } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await ReturnRequest.findAndCountAll({
      where,
      include: EXCHANGE_INCLUDE,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    res.json({ items: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Staff: list all ───────────────────────────────────────────────────────────

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const { count, rows } = await ReturnRequest.findAndCountAll({
      where, include: EXCHANGE_INCLUDE,
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
    });
    res.json({ total: count, page: parseInt(page), data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Staff: update status ──────────────────────────────────────────────────────

exports.update = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const request = await ReturnRequest.findByPk(req.params.id, {
      include: [{ model: Order, attributes: ['id', 'orderCode', 'total', 'userId'] }],
      transaction: t,
    });
    if (!request) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy yêu cầu' }); }

    const { status, staffNote } = req.body;
    const updates = { staffNote, handledBy: req.user.id, handledAt: new Date(), status };
    const uid = request.userId;
    const code = request.code;
    const orderCode = request.Order?.orderCode;
    const orderTotal = parseFloat(request.Order?.total || 0);
    const priceDiff = parseFloat(request.priceDiff || 0);

    if (status === 'approved') {
      const msg = request.type === 'return'
        ? `Yêu cầu trả hàng ${code} đã được duyệt. Vui lòng gửi hàng về địa chỉ shop để được hoàn tiền.`
        : `Yêu cầu đổi hàng ${code} đã được duyệt. Vui lòng gửi hàng cũ về địa chỉ shop.`;
      await notify(uid, 'order_status', 'Yêu cầu đổi/trả được duyệt ✅', msg, { returnId: request.id });

    } else if (status === 'goods_received') {
      // Restore stock of original order products (customer returned them)
      await restoreOrderStock(request.orderId, request.id, req.user.id, t);

      if (request.type === 'return') {
        const balanceAfter = await creditWallet(uid, orderTotal, `Hoàn tiền trả hàng ${code} - ĐH ${orderCode}`, code, t);
        updates.status = 'completed';
        await notify(uid, 'wallet_refund',
          'Hoàn tiền trả hàng 💰',
          `Đã hoàn ${orderTotal.toLocaleString('vi-VN')}đ vào ví cho đơn trả hàng ${code}. Số dư: ${balanceAfter.toLocaleString('vi-VN')}đ.`,
          { returnId: request.id, amount: orderTotal, balanceAfter });
      } else {
        updates.status = 'shipping_new';
        await notify(uid, 'order_status',
          'Đang giao hàng mới 🚚',
          `Shop đã nhận hàng cũ và đang chuẩn bị giao sản phẩm mới cho yêu cầu ${code}.`,
          { returnId: request.id });
      }

    } else if (status === 'completed' && request.type === 'exchange') {
      // New product stock was already reserved on create — stays decremented (permanently sold)
      // Notify based on whether there's a refund
      if (priceDiff < 0) {
        const refundAmt = Math.abs(priceDiff);
        const balanceAfter = await creditWallet(uid, refundAmt, `Hoàn tiền chênh lệch đổi hàng ${code}`, code, t);
        await notify(uid, 'wallet_refund',
          'Hoàn tiền chênh lệch đổi hàng 💸',
          `Đã hoàn ${refundAmt.toLocaleString('vi-VN')}đ chênh lệch vào ví. Số dư: ${balanceAfter.toLocaleString('vi-VN')}đ.`,
          { returnId: request.id, amount: refundAmt, balanceAfter });
      } else {
        await notify(uid, 'order_status', 'Đổi hàng hoàn tất ✅',
          `Yêu cầu đổi hàng ${code} đã hoàn tất. Cảm ơn bạn đã mua sắm tại YarnShop!`,
          { returnId: request.id });
      }

    } else if (status === 'rejected') {
      // Release reserved stock for exchange product
      if (request.type === 'exchange' && request.stockReservedAt) {
        await releaseExchangeStock(request.exchangeProductId, request.exchangeProductQty, request.id, req.user.id, t);
      }
      // Refund payment if already paid
      if (request.type === 'exchange' && request.extraPaidAt && priceDiff > 0) {
        const balanceAfter = await creditWallet(uid, priceDiff, `Hoàn tiền đổi hàng bị từ chối ${code}`, code, t);
        await notify(uid, 'wallet_refund',
          'Hoàn tiền đổi hàng 💰',
          `Yêu cầu ${code} bị từ chối. Đã hoàn ${priceDiff.toLocaleString('vi-VN')}đ vào ví. Số dư: ${balanceAfter.toLocaleString('vi-VN')}đ.`,
          { returnId: request.id, amount: priceDiff, balanceAfter });
      } else {
        await notify(uid, 'order_cancelled', 'Yêu cầu đổi/trả bị từ chối',
          `Yêu cầu ${code} đã bị từ chối.${staffNote ? ' Lý do: ' + staffNote : ''}`,
          { returnId: request.id });
      }
    }

    await request.update(updates, { transaction: t });
    await t.commit();

    const updated = await ReturnRequest.findByPk(req.params.id, { include: EXCHANGE_INCLUDE });
    res.json(updated);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};
