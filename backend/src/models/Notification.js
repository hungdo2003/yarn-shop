const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'order_paid', 'order_status', 'order_cancelled',
      'wallet_topup', 'wallet_payment', 'wallet_refund', 'system',
      'tier_upgrade'
    ),
    allowNull: false,
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT },
  data: { type: DataTypes.JSON, defaultValue: {} },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Notification;
