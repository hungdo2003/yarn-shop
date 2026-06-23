const { Notification, User, Role } = require('../models');

async function notify(userId, type, title, message, data = {}) {
  try {
    await Notification.create({ userId, type, title, message, data, isRead: false });
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

module.exports = { notify, notifyByRole };
