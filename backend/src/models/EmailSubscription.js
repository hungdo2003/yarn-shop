const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailSubscription = sequelize.define('EmailSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100) },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  subscribedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = EmailSubscription;
