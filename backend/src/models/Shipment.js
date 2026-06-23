const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  trackingCode: { type: DataTypes.STRING(100) },
  carrier: { type: DataTypes.STRING(100) },
  status: { type: DataTypes.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'failed'), defaultValue: 'pending' },
  estimatedDelivery: { type: DataTypes.DATE },
  deliveredAt: { type: DataTypes.DATE },
  note: { type: DataTypes.TEXT }
});

module.exports = Shipment;
