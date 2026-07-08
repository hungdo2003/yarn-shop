const { DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');

(async () => {
  const q = sequelize.getQueryInterface();
  await q.createTable('SaleEventRuns', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    saleEventId: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'SaleEvents', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    saleStartDate: { type: DataTypes.DATE, allowNull: true },
    saleEndDate: { type: DataTypes.DATE, allowNull: true },
    productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    discountPct: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  });
  console.log('SaleEventRuns table created');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
