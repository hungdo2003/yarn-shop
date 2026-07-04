const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.ENUM('guest', 'customer', 'staff', 'admin'), allowNull: false, unique: true },
  description: { type: DataTypes.STRING }
});

module.exports = Role;
