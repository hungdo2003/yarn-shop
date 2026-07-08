const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id:                { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code:              { type: DataTypes.STRING(50), unique: true },
  orderId:           { type: DataTypes.INTEGER, allowNull: false },
  userId:            { type: DataTypes.INTEGER, allowNull: false },
  type:              { type: DataTypes.ENUM('return', 'exchange'), allowNull: false },
  reason:            { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending_payment', 'pending', 'approved', 'goods_received', 'shipping_new', 'rejected', 'completed'),
    defaultValue: 'pending',
  },
  images:            { type: DataTypes.JSONB },
  customerNote:      { type: DataTypes.TEXT },
  staffNote:         { type: DataTypes.TEXT },
  handledBy:         { type: DataTypes.INTEGER },
  handledAt:         { type: DataTypes.DATE },
  // Exchange-specific
  exchangeProductId: { type: DataTypes.INTEGER },
  exchangeProductQty:{ type: DataTypes.INTEGER, defaultValue: 1 },
  // positive = customer pays more, negative = customer gets refund
  priceDiff:         { type: DataTypes.DECIMAL(12, 2) },
  extraPaidAt:       { type: DataTypes.DATE },
  stockReservedAt:   { type: DataTypes.DATE },
});

module.exports = ReturnRequest;
