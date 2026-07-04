const { sequelize, Order, OrderDetail, Payment, Shipment, Cart, CartItem, Product, Inventory, InventoryTransaction, Voucher, User, WalletTransaction } = require('../models');
const { notify, notifyByRole } = require('../services/notificationService');
const { generateCode, paginate, paginateResult } = require('../utils/helpers');
const { calcPointsEarned, calcMaxRedeemable, calcPointsDiscount } = require('../utils/loyalty');
const { Op } = require('sequelize');
const { log } = require('./log.controller');

const SHIPPING_FEES = { standard: 30000, express: 50000, economy: 15000 };
const FREE_SHIP_THRESHOLD = 500000;

const buildOrderItems = async (items, t) => {
  const details = [];
  for (const item of items) {
    const product = await Product.findByPk(item.productId, { transaction: t });
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
    details.push({
      productId: product.id, productName: product.name, productImage: product.thumbnailImage,
      quantity: item.quantity, unitPrice: item.price || product.salePrice || product.price,
      totalPrice: item.quantity * parseFloat(item.price || product.salePrice || product.price)
    });
  }
  return details;
};

const placeOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { shippingAddress, shippingName, shippingPhone, shippingMethod = 'standard', paymentMethod, voucherCode, note, guestEmail, items: guestItems, pointsToRedeem: rawPoints } = req.body;
    const isGuest = !req.user;

    let cartItems = [];
    let clearAllCart = false;
    let directOrderProductIds = [];

    if (!isGuest && !guestItems?.length) {
      // Normal authenticated checkout: read entire cart
      const cart = await Cart.findOne({ where: { userId: req.user.id }, include: [{ model: CartItem, include: [Product] }], transaction: t });
      if (!cart?.CartItems?.length) { await t.rollback(); return res.status(400).json({ message: 'Cart is empty' }); }
      cartItems = cart.CartItems.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, Product: i.Product, cartItemId: i.id, cartId: cart.id }));
      clearAllCart = true;
    } else {
      // Buy Now / Selected items (auth or guest): items provided directly
      if (!guestItems?.length) { await t.rollback(); return res.status(400).json({ message: 'No items provided' }); }
      for (const gi of guestItems) {
        const p = await Product.findByPk(gi.productId, { transaction: t });
        if (!p) { await t.rollback(); return res.status(400).json({ message: `Product ${gi.productId} not found` }); }
        cartItems.push({ productId: p.id, quantity: gi.quantity, price: p.salePrice || p.price, Product: p });
      }
      if (!isGuest) directOrderProductIds = guestItems.map(i => i.productId);
    }

    const subtotal = cartItems.reduce((s, i) => s + i.quantity * parseFloat(i.price), 0);
    let baseFee = shippingMethod === 'standard' && subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEES[shippingMethod] || 30000;
    let discount = 0;
    let voucher = null;

    if (voucherCode) {
      voucher = await Voucher.findOne({ where: { code: voucherCode, isActive: true }, transaction: t });
      if (!voucher || new Date() > voucher.endDate || new Date() < voucher.startDate) {
        await t.rollback(); return res.status(400).json({ message: 'Invalid or expired voucher' });
      }
      if (voucher.type === 'percentage') discount = Math.min(subtotal * voucher.value / 100, voucher.maxDiscountAmount || Infinity);
      else if (voucher.type === 'fixed') discount = Math.min(voucher.value, subtotal);
      else if (voucher.type === 'free_shipping') { discount = baseFee; baseFee = 0; }
    }
    let pointsUsed = 0;
    let pointsDiscount = 0;
    if (!isGuest && rawPoints && parseInt(rawPoints) > 0) {
      const buyer = await User.findByPk(req.user.id, { transaction: t });
      const maxRedeemable = calcMaxRedeemable(subtotal + baseFee - discount, buyer.loyaltyPoints || 0);
      pointsUsed = Math.min(parseInt(rawPoints), maxRedeemable);
      pointsDiscount = calcPointsDiscount(pointsUsed);
    }

    const total = subtotal + baseFee - discount - pointsDiscount;
    const pointsEarned = !isGuest ? calcPointsEarned(total) : 0;

    // Validate stock before creating order
    for (const item of cartItems) {
      if (item.Product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Sản phẩm "${item.Product.name}" không đủ số lượng trong kho` });
      }
    }

    const useWallet = !isGuest && paymentMethod === 'wallet';
    if (useWallet) {
      const buyer = await User.findByPk(req.user.id, { transaction: t });
      if (parseFloat(buyer.walletBalance || 0) < total) {
        await t.rollback();
        return res.status(400).json({ message: `Số dư ví không đủ. Số dư hiện tại: ${parseFloat(buyer.walletBalance || 0).toLocaleString('vi-VN')}đ` });
      }
    }

    const order = await Order.create({
      orderCode: generateCode('ORD'),
      userId: isGuest ? null : req.user.id,
      isGuest, guestEmail: guestEmail || null,
      shippingAddress, shippingName, shippingPhone, shippingMethod,
      subtotal, shippingFee: baseFee, discount, total,
      voucherId: voucher?.id, note,
      pointsUsed, pointsEarned,
      status: useWallet ? 'paid' : 'pending_payment',
    }, { transaction: t });

    const details = [];
    for (const item of cartItems) {
      const product = item.Product;
      details.push({
        orderId: order.id, productId: product.id, productName: product.name,
        productImage: product.thumbnailImage, quantity: item.quantity,
        unitPrice: item.price, totalPrice: item.quantity * parseFloat(item.price)
      });
    }
    await OrderDetail.bulkCreate(details, { transaction: t });

    if (useWallet) {
      // Deduct from wallet immediately
      const buyer = await User.findByPk(req.user.id, { transaction: t });
      const balanceBefore = parseFloat(buyer.walletBalance || 0);
      const balanceAfter = balanceBefore - total;
      await buyer.update({ walletBalance: balanceAfter }, { transaction: t });
      await WalletTransaction.create({
        userId: req.user.id, type: 'payment', amount: -total,
        balanceBefore, balanceAfter, orderId: order.id,
        description: `Thanh toán đơn hàng ${order.orderCode}`,
      }, { transaction: t });
      await Payment.create({ orderId: order.id, method: 'wallet', amount: total, status: 'paid', paidAt: new Date() }, { transaction: t });
      // Deduct redeemed points and award earned points
      if (pointsUsed > 0) await buyer.decrement('loyaltyPoints', { by: pointsUsed, transaction: t });
      if (pointsEarned > 0) await buyer.increment('loyaltyPoints', { by: pointsEarned, transaction: t });
      // Decrement stock immediately
      for (const item of cartItems) {
        const product = item.Product;
        const decBy = Math.min(item.quantity, product.stock);
        if (decBy > 0) await product.decrement('stock', { by: decBy, transaction: t });
        await product.increment('sold', { by: item.quantity, transaction: t });
        await InventoryTransaction.create({
          productId: product.id, type: 'sale', quantity: -item.quantity,
          referenceId: order.id, referenceType: 'order', performedBy: req.user.id,
        }, { transaction: t });
      }
    } else {
      await Payment.create({ orderId: order.id, method: 'payos', amount: total, status: 'unpaid' }, { transaction: t });
      // Deduct redeemed points immediately (before payment) to prevent double-spend
      if (!isGuest && pointsUsed > 0) {
        const buyer = await User.findByPk(req.user.id, { transaction: t });
        await buyer.decrement('loyaltyPoints', { by: pointsUsed, transaction: t });
      }
    }

    await Shipment.create({ orderId: order.id }, { transaction: t });
    if (voucher) await voucher.increment('usedCount', { transaction: t });
    if (!isGuest) {
      const cart = await Cart.findOne({ where: { userId: req.user.id }, transaction: t });
      if (cart) {
        if (clearAllCart) {
          await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });
        } else if (directOrderProductIds.length > 0) {
          await CartItem.destroy({ where: { cartId: cart.id, productId: directOrderProductIds }, transaction: t });
        }
      }
    }
    await t.commit();

    if (useWallet && !isGuest) {
      await notify(req.user.id, 'wallet_payment',
        'Thanh toán đơn hàng thành công',
        `Đã thanh toán ${total.toLocaleString('vi-VN')}đ cho đơn hàng ${order.orderCode} qua ví.`,
        { orderId: order.id, orderCode: order.orderCode, amount: total }
      );
      await notifyByRole('staff', 'order_paid',
        'Đơn hàng mới cần xử lý',
        `Đơn hàng ${order.orderCode} vừa được thanh toán qua ví. Vui lòng xác nhận.`,
        { orderId: order.id, orderCode: order.orderCode }
      );
    }

    await log(req.user?.id, req.user?.email || guestEmail, 'PLACE_ORDER', 'Order', order.id, { orderCode: order.orderCode, total, paymentMethod }, req);
    res.status(201).json({
      message: useWallet ? 'Đặt hàng thành công, đã thanh toán qua ví' : 'Đơn hàng đã được tạo, vui lòng thanh toán',
      orderCode: order.orderCode, orderId: order.id, paidByWallet: useWallet,
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, from, to, search } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (search) where[Op.or] = [{ orderCode: { [Op.iLike]: `%${search}%` } }, { shippingName: { [Op.iLike]: `%${search}%` } }];
    if (from || to) { where.createdAt = {}; if (from) where.createdAt[Op.gte] = new Date(from); if (to) where.createdAt[Op.lte] = new Date(to); }
    const { count, rows } = await Order.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']], include: [{ model: OrderDetail }, { model: Payment }] });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getOrderDetail = async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user && !['admin', 'staff'].includes(req.user.Role?.name)) where.userId = req.user.id;
    const order = await Order.findOne({
      where,
      include: [
        { model: OrderDetail, include: [{ model: Product, attributes: ['id', 'slug'] }] },
        Payment, Shipment, Voucher,
      ],
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAllOrders = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, search, paymentStatus, shippingMethod, from, to, callConfirmed } = req.query;
    const where = {};
    if (status) where.status = status;
    if (shippingMethod) where.shippingMethod = shippingMethod;
    if (callConfirmed !== undefined) where.callConfirmed = callConfirmed === 'true';
    if (search) where[Op.or] = [
      { orderCode: { [Op.iLike]: `%${search}%` } },
      { shippingName: { [Op.iLike]: `%${search}%` } },
      { shippingPhone: { [Op.iLike]: `%${search}%` } },
      { guestEmail: { [Op.iLike]: `%${search}%` } }
    ];
    if (from || to) { where.createdAt = {}; if (from) where.createdAt[Op.gte] = new Date(from); if (to) where.createdAt[Op.lte] = new Date(to); }

    const paymentWhere = {};
    if (paymentStatus) paymentWhere.status = paymentStatus;

    const { count, rows } = await Order.findAndCountAll({
      where, limit, offset, order: [['createdAt', 'DESC']],
      include: [
        { model: User, attributes: ['id', 'fullName', 'email', 'phone'], required: false },
        { model: OrderDetail },
        { model: Payment, where: Object.keys(paymentWhere).length ? paymentWhere : undefined, required: false }
      ],
      distinct: true
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Valid staff-driven transitions
const ALLOWED_TRANSITIONS = {
  paid: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping'],
  shipping: ['delivered'],
  // legacy
  pending: ['confirmed', 'cancelled'],
};

const updateStatus = async (req, res) => {
  try {
    const { status, cancelledReason, callConfirmed, callNote } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (status) {
      const allowed = ALLOWED_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"` });
      }
    }

    const updates = {};
    if (status) updates.status = status;
    if (status === 'confirmed') { updates.confirmedBy = req.user.id; updates.confirmedAt = new Date(); }
    if (status === 'cancelled') updates.cancelledReason = cancelledReason || 'Nhân viên hủy đơn';
    if (callConfirmed !== undefined) updates.callConfirmed = callConfirmed;
    if (callNote !== undefined) updates.callNote = callNote;
    await order.update(updates);
    await log(req.user?.id, req.user?.email, 'UPDATE_ORDER_STATUS', 'Order', order.id, { orderCode: order.orderCode, status, callConfirmed }, req);

    // Notify customer of status change
    if (status && order.userId) {
      const STATUS_MSG = {
        confirmed: 'đã được xác nhận và đang chuẩn bị hàng',
        preparing: 'đang được đóng gói và chuẩn bị giao',
        shipping: 'đang được giao đến bạn',
        delivered: 'đã giao thành công. Cảm ơn bạn đã mua hàng!',
        cancelled: 'đã bị hủy bởi nhân viên',
      };
      const msg = STATUS_MSG[status];
      if (msg) {
        await notify(order.userId, 'order_status',
          `Cập nhật đơn hàng ${order.orderCode}`,
          `Đơn hàng của bạn ${msg}.`,
          { orderId: order.id, orderCode: order.orderCode, status }
        );
      }
    }

    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.user.id }, transaction: t });
    if (!order) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy đơn hàng' }); }
    if (!['pending_payment', 'paid', 'confirmed'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này' });
    }

    const wasAlreadyPaid = ['paid', 'confirmed'].includes(order.status);
    await order.update({ status: 'cancelled', cancelledReason: req.body.reason || 'Khách hàng hủy đơn' }, { transaction: t });
    await Payment.update({ status: 'refunded' }, { where: { orderId: order.id }, transaction: t });

    // Refund to wallet if order was paid
    if (wasAlreadyPaid && order.userId) {
      const user = await User.findByPk(order.userId, { transaction: t });
      const balanceBefore = parseFloat(user.walletBalance || 0);
      const refundAmt = parseFloat(order.total);
      const balanceAfter = balanceBefore + refundAmt;
      await user.update({ walletBalance: balanceAfter }, { transaction: t });
      await WalletTransaction.create({
        userId: order.userId, type: 'refund', amount: refundAmt,
        balanceBefore, balanceAfter, orderId: order.id,
        description: `Hoàn tiền đơn hàng ${order.orderCode}`,
      }, { transaction: t });
    }

    await t.commit();
    await log(req.user?.id, req.user?.email, 'CANCEL_ORDER', 'Order', order.id, { orderCode: order.orderCode, refunded: wasAlreadyPaid, reason: req.body.reason }, req);

    if (order.userId) {
      if (wasAlreadyPaid) {
        await notify(order.userId, 'wallet_refund',
          'Hoàn tiền đơn hàng',
          `Đơn hàng ${order.orderCode} đã hủy. ${parseFloat(order.total).toLocaleString('vi-VN')}đ đã được hoàn vào ví của bạn.`,
          { orderId: order.id, orderCode: order.orderCode, amount: parseFloat(order.total) }
        );
      } else {
        await notify(order.userId, 'order_cancelled',
          'Đơn hàng đã hủy',
          `Đơn hàng ${order.orderCode} đã được hủy thành công.`,
          { orderId: order.id, orderCode: order.orderCode }
        );
      }
    }

    const refundMsg = wasAlreadyPaid ? ` Tiền đã được hoàn về ví của bạn.` : '';
    res.json({ message: `Đã hủy đơn hàng.${refundMsg}`, refunded: wasAlreadyPaid });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderDetail, getAllOrders, updateStatus, cancelOrder };
