const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  reservedQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  minStockLevel: { type: DataTypes.INTEGER, defaultValue: 5 },
  lastRestockedAt: { type: DataTypes.DATE }
});

module.exports = Inventory;
