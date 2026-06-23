const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShippingAddress = sequelize.define('ShippingAddress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  province: { type: DataTypes.STRING(100) },
  district: { type: DataTypes.STRING(100) },
  ward: { type: DataTypes.STRING(100) },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

module.exports = ShippingAddress;
