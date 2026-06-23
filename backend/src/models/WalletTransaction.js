const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTransaction = sequelize.define('WalletTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('topup', 'payment', 'refund', 'admin_adjustment'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  balanceBefore: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  balanceAfter: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  orderId: { type: DataTypes.INTEGER },
  description: { type: DataTypes.STRING(255) },
  reference: { type: DataTypes.STRING(100) },
});

module.exports = WalletTransaction;
