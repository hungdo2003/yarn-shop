const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatConversation = sequelize.define('ChatConversation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  staffId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('open', 'active', 'closed'), defaultValue: 'open' },
  lastMessageAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = ChatConversation;
