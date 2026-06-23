const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WalletTopup = sequelize.define('WalletTopup', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  orderCode: { type: DataTypes.BIGINT, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'), defaultValue: 'pending' },
  checkoutUrl: { type: DataTypes.TEXT },
});

module.exports = WalletTopup;
