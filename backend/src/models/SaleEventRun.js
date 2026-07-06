const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleEventRun = sequelize.define('SaleEventRun', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saleEventId: { type: DataTypes.INTEGER, allowNull: false },
  saleStartDate: { type: DataTypes.DATE },
  saleEndDate: { type: DataTypes.DATE },
  productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  discountPct: { type: DataTypes.INTEGER },
});

module.exports = SaleEventRun;
