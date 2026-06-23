const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactMessage = sequelize.define('ContactMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  subject: { type: DataTypes.STRING(200) },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('new', 'read', 'replied'), defaultValue: 'new' },
  replyNote: { type: DataTypes.TEXT },
  repliedAt: { type: DataTypes.DATE },
  repliedBy: { type: DataTypes.INTEGER }
});

module.exports = ContactMessage;
