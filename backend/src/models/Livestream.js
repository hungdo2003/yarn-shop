const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Livestream = sequelize.define('Livestream', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  staffId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('waiting', 'live', 'ended'), defaultValue: 'waiting' },
  viewerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  thumbnailUrl: { type: DataTypes.STRING },
  scheduledAt: { type: DataTypes.DATE, allowNull: true },
  startedAt: { type: DataTypes.DATE },
  endedAt: { type: DataTypes.DATE },
});

module.exports = Livestream;
