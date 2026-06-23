const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('return', 'exchange'), allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
  images: { type: DataTypes.JSONB },
  customerNote: { type: DataTypes.TEXT },
  staffNote: { type: DataTypes.TEXT },
  handledBy: { type: DataTypes.INTEGER },
  handledAt: { type: DataTypes.DATE }
});

module.exports = ReturnRequest;
