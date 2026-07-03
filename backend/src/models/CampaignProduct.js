const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaignProduct = sequelize.define('CampaignProduct', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  productId:  { type: DataTypes.INTEGER, allowNull: false },
  sortOrder:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  indexes: [{ unique: true, fields: ['campaignId', 'productId'] }],
});

module.exports = CampaignProduct;
