const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Voucher = sequelize.define('Voucher', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  type: { type: DataTypes.ENUM('percentage', 'fixed', 'free_shipping', 'flash_sale'), allowNull: false },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  minOrderAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  maxDiscountAmount: { type: DataTypes.DECIMAL(12, 2) },
  usageLimit: { type: DataTypes.INTEGER },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdBy: { type: DataTypes.INTEGER }
});

module.exports = Voucher;
