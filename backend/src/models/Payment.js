const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  method: { type: DataTypes.ENUM('cod', 'bank_transfer', 'e_wallet', 'payos', 'wallet'), allowNull: false },
  status: { type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'failed', 'cancelled'), defaultValue: 'unpaid' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  transactionId: { type: DataTypes.STRING(100) },
  paidAt: { type: DataTypes.DATE },
  note: { type: DataTypes.TEXT }
});

module.exports = Payment;
