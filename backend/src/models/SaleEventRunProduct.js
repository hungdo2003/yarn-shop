const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleEventRunProduct = sequelize.define('SaleEventRunProduct', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  runId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER },
  name: { type: DataTypes.STRING(300) },
  price: { type: DataTypes.DECIMAL(15, 2) },
  salePrice: { type: DataTypes.DECIMAL(15, 2) },
  thumbnailImage: { type: DataTypes.TEXT },
}, { timestamps: false });

module.exports = SaleEventRunProduct;
