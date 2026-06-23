const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryTransaction = sequelize.define('InventoryTransaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('import', 'export', 'adjustment', 'sale', 'return'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  quantityBefore: { type: DataTypes.INTEGER },
  quantityAfter: { type: DataTypes.INTEGER },
  referenceId: { type: DataTypes.INTEGER },
  referenceType: { type: DataTypes.STRING(50) },
  note: { type: DataTypes.TEXT },
  performedBy: { type: DataTypes.INTEGER }
});

module.exports = InventoryTransaction;
