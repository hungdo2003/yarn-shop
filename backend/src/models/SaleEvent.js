const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleEvent = sequelize.define('SaleEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  discountPct: { type: DataTypes.INTEGER },
  saleStartDate: { type: DataTypes.DATE },
  saleEndDate: { type: DataTypes.DATE },
  productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  selectAll: { type: DataTypes.BOOLEAN, defaultValue: false },
  productIds: { type: DataTypes.JSONB },
  isRemoval: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdBy: { type: DataTypes.INTEGER },
});

module.exports = SaleEvent;
