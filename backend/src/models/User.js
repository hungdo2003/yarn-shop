const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fullName: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  address: { type: DataTypes.TEXT },
  avatar: { type: DataTypes.STRING(255) },
  roleId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  loyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  walletBalance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }
});

module.exports = User;
