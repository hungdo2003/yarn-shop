const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CustomOrder = sequelize.define('CustomOrder', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  yarnColor: { type: DataTypes.STRING(100) },
  size: { type: DataTypes.STRING(100) },
  status: {
    type: DataTypes.ENUM('submitted', 'reviewing', 'quoted', 'deposit_paid', 'in_production', 'completed', 'delivered', 'remaining_paid', 'cancelled'),
    defaultValue: 'submitted'
  },
  quotedPrice: { type: DataTypes.DECIMAL(12, 2) },
  depositAmount: { type: DataTypes.DECIMAL(12, 2) },
  depositPaidAt: { type: DataTypes.DATE },
  remainingPaidAt: { type: DataTypes.DATE },
  estimatedDays: { type: DataTypes.INTEGER },
  staffNote: { type: DataTypes.TEXT },
  handledBy: { type: DataTypes.INTEGER },
  completedAt: { type: DataTypes.DATE }
});

module.exports = CustomOrder;
