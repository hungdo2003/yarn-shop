const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialUsage = sequelize.define('MaterialUsage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  materialId: { type: DataTypes.INTEGER, allowNull: false },
  referenceId: { type: DataTypes.INTEGER, allowNull: false },
  referenceType: { type: DataTypes.ENUM('custom_order', 'production'), allowNull: false },
  quantityUsed: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  usedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  note: { type: DataTypes.TEXT }
});

module.exports = MaterialUsage;
