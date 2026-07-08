const { Notification, User, Role, Order } = require('../models');
const { Op } = require('sequelize');

let _io = null;
function setIo(io) { _io = io; }

async function notify(userId, type, title, message, data = {}) {
  try {
    await Notification.create({ userId, type, title, message, data, isRead: false });
    if (_io) _io.to(`user:${userId}`).emit('notification:new');
  } catch (err) {
    console.error('notify error:', err.message);
  }
}

async function notifyByRole(roleName, type, title, message, data = {}) {
  try {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) return;
    const users = await User.findAll({ where: { roleId: role.id, isActive: true }, attributes: ['id'] });
    await Promise.all(users.map(u => notify(u.id, type, title, message, data)));
  } catch (err) {
    console.error('notifyByRole error:', err.message);
  }
}

// Check if user crossed a tier boundary after paying for an order, notify if so
async function checkTierUpgrade(userId, currentOrderId, currentOrderTotal) {
  try {
    const { getTier } = require('../utils/membership');
    const PAID = { [Op.notIn]: ['pending_payment', 'cancelled'] };
    const rawOldTotal = await Order.sum('total', {
      where: { userId, status: PAID, id: { [Op.ne]: currentOrderId } },
    });
    const oldTotal = parseFloat(rawOldTotal) || 0;
    const newTotal = oldTotal + parseFloat(currentOrderTotal);
    const oldTier = getTier(oldTotal);
    const newTier = getTier(newTotal);
    if (oldTier.name !== newTier.name) {
      await notify(
        userId,
        'tier_upgrade',
        `Chúc mừng! Bạn đã thăng hạng ${newTier.emoji}`,
        `Tổng chi tiêu đạt ${newTotal.toLocaleString('vi-VN')}đ. Hạng thành viên của bạn đã nâng lên hạng ${newTier.label}!`,
        { newTier: newTier.name, oldTier: oldTier.name, newTierLabel: newTier.label, newTierEmoji: newTier.emoji, totalSpent: newTotal }
      );
    }
  } catch (err) {
    console.error('checkTierUpgrade error:', err.message);
  }
}

module.exports = { notify, notifyByRole, checkTierUpgrade, setIo };
