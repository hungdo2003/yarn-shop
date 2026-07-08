const { CustomOrder, CustomOrderImage, User, WalletTransaction, sequelize } = require('../models');
const { Op } = require('sequelize');
const { generateCode, paginate, paginateResult } = require('../utils/helpers');
const { notify, notifyByRole } = require('../services/notificationService');
const { fileUrl } = require('../middleware/upload.middleware');

// Staff-allowed transitions per current status
const ALLOWED_TRANSITIONS = {
  submitted:    ['reviewing', 'cancelled'],
  reviewing:    ['quoted', 'cancelled'],
  quoted:       ['cancelled'],             // wait for customer payment
  deposit_paid: ['in_production', 'cancelled'],
  in_production:['completed', 'cancelled'],
  completed:    ['delivered'],
  delivered:    [],
  cancelled:    [],
};

const submit = async (req, res) => {
  try {
    const { description, yarnColor, size } = req.body;
    const code = generateCode('CUS');
    const order = await CustomOrder.create({ code, userId: req.user.id, description, yarnColor, size });
    if (req.files?.length) {
      const imgs = req.files.map((f, i) => ({ customOrderId: order.id, imageUrl: fileUrl(f), sortOrder: i }));
      await CustomOrderImage.bulkCreate(imgs);
    }
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyOrders = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, from, to } = req.query;
    const where = { userId: req.user.id };
    if (status) where.status = status;
    if (from || to) { where.createdAt = {}; if (from) where.createdAt[Op.gte] = new Date(from); if (to) where.createdAt[Op.lte] = new Date(to + 'T23:59:59'); }
    const { count, rows } = await CustomOrder.findAndCountAll({
      where, include: [CustomOrderImage],
      limit, offset, order: [['createdAt', 'DESC']]
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getMyOrderById = async (req, res) => {
  try {
    const order = await CustomOrder.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [CustomOrderImage],
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getAll = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (from || to) { where.createdAt = {}; if (from) where.createdAt[Op.gte] = new Date(from); if (to) where.createdAt[Op.lte] = new Date(to + 'T23:59:59'); }
    const { count, rows } = await CustomOrder.findAndCountAll({
      where, limit, offset, order: [['createdAt', 'DESC']],
      include: [
        CustomOrderImage,
        { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'walletBalance'] }
      ]
    });
    res.json(paginateResult(count, rows, page, limit));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getById = async (req, res) => {
  try {
    const order = await CustomOrder.findByPk(req.params.id, {
      include: [CustomOrderImage, { model: User, attributes: ['id', 'fullName', 'email', 'phone', 'walletBalance'] }]
    });
    if (!order) return res.status(404).json({ message: 'Custom order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStatus = async (req, res) => {
  try {
    const { status, quotedPrice, depositAmount, estimatedDays, staffNote } = req.body;
    const order = await CustomOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Không thể chuyển từ "${order.status}" sang "${status}"${order.status === 'quoted' ? '. Chờ khách hàng thanh toán.' : ''}`
      });
    }

    const updates = { status, staffNote };
    if (quotedPrice !== undefined && quotedPrice !== '') updates.quotedPrice = quotedPrice;
    if (depositAmount !== undefined && depositAmount !== '') updates.depositAmount = depositAmount;
    if (estimatedDays !== undefined && estimatedDays !== '') updates.estimatedDays = estimatedDays;
    if (status === 'in_production' || status === 'quoted') updates.handledBy = req.user.id;
    if (status === 'completed') updates.completedAt = new Date();

    await order.update(updates);

    if (status === 'quoted' && quotedPrice) {
      notify(order.userId, 'custom_order_quoted', 'Báo giá đơn thiết kế',
        `Đơn #${order.code} đã được báo giá ${Number(quotedPrice).toLocaleString('vi-VN')}đ. Vui lòng thanh toán để tiến hành sản xuất.`,
        { customOrderId: order.id }
      );
    }
    if (status === 'in_production') {
      notify(order.userId, 'custom_order_production', 'Đơn đang sản xuất',
        `Đơn thiết kế #${order.code} đang được sản xuất.`,
        { customOrderId: order.id }
      );
    }
    if (status === 'delivered') {
      notify(order.userId, 'custom_order_delivered', 'Đã giao hàng',
        `Đơn thiết kế #${order.code} đã được giao hàng thành công!`,
        { customOrderId: order.id }
      );
    }

    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Customer pays for the custom order via wallet
const payCustomOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await CustomOrder.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy đơn hàng' }); }
    if (order.status !== 'quoted') {
      await t.rollback();
      return res.status(400).json({ message: 'Đơn hàng chưa được báo giá hoặc đã thanh toán' });
    }
    if (!order.quotedPrice) {
      await t.rollback();
      return res.status(400).json({ message: 'Đơn hàng chưa có giá báo' });
    }

    const payAmount = parseFloat(order.depositAmount || order.quotedPrice);
    const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
    const balance = parseFloat(user.walletBalance || 0);

    if (balance < payAmount) {
      await t.rollback();
      return res.status(400).json({
        message: `Số dư ví không đủ. Số dư: ${balance.toLocaleString('vi-VN')}đ, cần: ${payAmount.toLocaleString('vi-VN')}đ`
      });
    }

    const balanceAfter = balance - payAmount;
    await user.update({ walletBalance: balanceAfter }, { transaction: t });

    await WalletTransaction.create({
      userId: user.id,
      type: 'payment',
      amount: payAmount,
      balanceBefore: balance,
      balanceAfter,
      description: `Thanh toán đơn thiết kế #${order.code}`,
      reference: order.code,
    }, { transaction: t });

    await order.update({ status: 'deposit_paid', depositPaidAt: new Date() }, { transaction: t });

    await t.commit();

    if (order.handledBy) {
      notify(order.handledBy, 'custom_order_paid', 'Khách đã thanh toán',
        `Khách hàng đã thanh toán đơn thiết kế #${order.code} (${payAmount.toLocaleString('vi-VN')}đ). Có thể bắt đầu sản xuất.`,
        { customOrderId: order.id }
      );
    } else {
      notifyByRole('staff', 'custom_order_paid', 'Khách đã thanh toán',
        `Khách hàng đã thanh toán đơn thiết kế #${order.code} (${payAmount.toLocaleString('vi-VN')}đ).`,
        { customOrderId: order.id }
      );
    }

    res.json({ message: 'Thanh toán thành công', walletBalance: balanceAfter });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

// Customer pays the remaining amount after delivery
const payRemainingCustomOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await CustomOrder.findOne({
      where: { id: req.params.id, userId: req.user.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) { await t.rollback(); return res.status(404).json({ message: 'Không tìm thấy đơn hàng' }); }
    if (order.status !== 'delivered') {
      await t.rollback();
      return res.status(400).json({ message: 'Đơn hàng chưa được giao hoặc đã thanh toán đủ' });
    }

    const quoted = parseFloat(order.quotedPrice || 0);
    const deposit = parseFloat(order.depositAmount || 0);
    const remaining = quoted - deposit;

    if (!order.depositAmount || remaining <= 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Không có số tiền còn lại cần thanh toán' });
    }

    const user = await User.findByPk(req.user.id, { transaction: t, lock: t.LOCK.UPDATE });
    const balance = parseFloat(user.walletBalance || 0);

    if (balance < remaining) {
      await t.rollback();
      return res.status(400).json({
        message: `Số dư ví không đủ. Số dư: ${balance.toLocaleString('vi-VN')}đ, cần: ${remaining.toLocaleString('vi-VN')}đ`
      });
    }

    const balanceAfter = balance - remaining;
    await user.update({ walletBalance: balanceAfter }, { transaction: t });

    await WalletTransaction.create({
      userId: user.id,
      type: 'payment',
      amount: remaining,
      balanceBefore: balance,
      balanceAfter,
      description: `Thanh toán phần còn lại đơn thiết kế #${order.code}`,
      reference: order.code,
    }, { transaction: t });

    await order.update({ status: 'remaining_paid', remainingPaidAt: new Date() }, { transaction: t });

    await t.commit();

    if (order.handledBy) {
      notify(order.handledBy, 'custom_order_paid', 'Khách đã thanh toán phần còn lại',
        `Khách hàng đã thanh toán ${remaining.toLocaleString('vi-VN')}đ còn lại của đơn thiết kế #${order.code}. Đơn hàng đã hoàn tất.`,
        { customOrderId: order.id }
      );
    } else {
      notifyByRole('staff', 'custom_order_paid', 'Khách đã thanh toán phần còn lại',
        `Khách hàng đã thanh toán ${remaining.toLocaleString('vi-VN')}đ còn lại của đơn thiết kế #${order.code}.`,
        { customOrderId: order.id }
      );
    }

    res.json({ message: 'Thanh toán thành công', walletBalance: balanceAfter });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

module.exports = { submit, getMyOrders, getMyOrderById, getAll, getById, updateStatus, payCustomOrder, payRemainingCustomOrder };
