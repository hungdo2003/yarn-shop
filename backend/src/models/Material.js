const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  unit: { type: DataTypes.STRING(30), defaultValue: 'gram' },
  stock: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  costPerUnit: { type: DataTypes.DECIMAL(10, 2) },
  description: { type: DataTypes.TEXT }
});

module.exports = Material;
