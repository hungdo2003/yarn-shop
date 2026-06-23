const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  productName: { type: DataTypes.STRING(200) },
  productImage: { type: DataTypes.STRING(255) },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
});

module.exports = OrderDetail;
