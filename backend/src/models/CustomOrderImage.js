const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomOrderImage = sequelize.define('CustomOrderImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customOrderId: { type: DataTypes.INTEGER, allowNull: false },
  imageUrl: { type: DataTypes.STRING(255), allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
});

module.exports = CustomOrderImage;
