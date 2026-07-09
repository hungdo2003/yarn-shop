const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LivestreamComment = sequelize.define('LivestreamComment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  livestreamId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  guestName: { type: DataTypes.STRING(100), allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = LivestreamComment;
