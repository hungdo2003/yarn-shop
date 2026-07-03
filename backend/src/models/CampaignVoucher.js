const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CampaignVoucher = sequelize.define('CampaignVoucher', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  voucherId:  { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [{ unique: true, fields: ['campaignId', 'voucherId'] }],
});

module.exports = CampaignVoucher;
