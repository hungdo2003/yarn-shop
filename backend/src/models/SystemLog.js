const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemLog = sequelize.define('SystemLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  userEmail: { type: DataTypes.STRING(150) },
  action: { type: DataTypes.STRING(100), allowNull: false },
  resource: { type: DataTypes.STRING(100) },
  resourceId: { type: DataTypes.INTEGER },
  details: { type: DataTypes.JSONB },
  ipAddress: { type: DataTypes.STRING(45) },
  userAgent: { type: DataTypes.STRING(300) },
  status: { type: DataTypes.ENUM('success', 'failure'), defaultValue: 'success' }
}, { updatedAt: false });

module.exports = SystemLog;
