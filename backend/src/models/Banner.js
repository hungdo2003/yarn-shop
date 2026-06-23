const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  subtitle: { type: DataTypes.STRING(300) },
  imageUrl: { type: DataTypes.STRING(255), allowNull: false },
  linkUrl: { type: DataTypes.STRING(255) },
  position: { type: DataTypes.ENUM('home_hero', 'home_banner', 'popup', 'sidebar'), defaultValue: 'home_banner' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  startDate: { type: DataTypes.DATE },
  endDate: { type: DataTypes.DATE },
  createdBy: { type: DataTypes.INTEGER }
});

module.exports = Banner;
