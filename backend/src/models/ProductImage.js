const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  imageUrl: { type: DataTypes.STRING(255), allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isPrimary: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = ProductImage;
