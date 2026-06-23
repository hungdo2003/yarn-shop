const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderCode: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  userId: { type: DataTypes.INTEGER },
  isGuest: { type: DataTypes.BOOLEAN, defaultValue: false },
  guestEmail: { type: DataTypes.STRING(150) },
  status: {
    type: DataTypes.ENUM('pending_payment', 'paid', 'confirmed', 'preparing', 'shipping', 'delivered', 'cancelled', 'pending', 'completed'),
    defaultValue: 'pending_payment'
  },
  shippingAddress: { type: DataTypes.TEXT, allowNull: false },
  shippingName: { type: DataTypes.STRING(100) },
  shippingPhone: { type: DataTypes.STRING(20) },
  shippingMethod: { type: DataTypes.ENUM('standard', 'express', 'economy'), defaultValue: 'standard' },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  shippingFee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  voucherId: { type: DataTypes.INTEGER },
  note: { type: DataTypes.TEXT },
  confirmedBy: { type: DataTypes.INTEGER },
  confirmedAt: { type: DataTypes.DATE },
  cancelledReason: { type: DataTypes.TEXT },
  callConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  callNote: { type: DataTypes.TEXT }
});

module.exports = Order;
