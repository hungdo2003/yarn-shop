const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), unique: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  salePrice: { type: DataTypes.DECIMAL(12, 2) },
  color: { type: DataTypes.STRING(100) },
  size: { type: DataTypes.STRING(100) },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  sold: { type: DataTypes.INTEGER, defaultValue: 0 },
  averageRating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  thumbnailImage: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'), defaultValue: 'active' },
  isCustomizable: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = Product;
