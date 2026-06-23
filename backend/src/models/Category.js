const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), unique: true },
  type: { type: DataTypes.ENUM('raw_material', 'accessory', 'finished_product'), allowNull: false },
  description: { type: DataTypes.TEXT },
  image: { type: DataTypes.STRING(255) },
  parentId: { type: DataTypes.INTEGER, defaultValue: null }
});

module.exports = Category;
