const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slug:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name:        { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  theme:       { type: DataTypes.STRING(100), defaultValue: 'rose' }, // CSS gradient key or hex
  bannerImage: { type: DataTypes.STRING(500) },
  emoji:       { type: DataTypes.STRING(10), defaultValue: '🎉' },
  startDate:   { type: DataTypes.DATE, allowNull: false },
  endDate:     { type: DataTypes.DATE, allowNull: false },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Campaign;
