const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteContent = sequelize.define('SiteContent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: {
    type: DataTypes.ENUM('policies', 'how_to_buy', 'contact_info', 'about_us', 'shipping_policy', 'return_policy', 'privacy_policy'),
    allowNull: false, unique: true
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  updatedBy: { type: DataTypes.INTEGER }
});

module.exports = SiteContent;
