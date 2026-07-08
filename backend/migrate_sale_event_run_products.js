const { DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');

(async () => {
  const q = sequelize.getQueryInterface();
  await q.createTable('SaleEventRunProducts', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    runId: {
      type: DataTypes.INTEGER, allowNull: false,
      references: { model: 'SaleEventRuns', key: 'id' },
      onUpdate: 'CASCADE', onDelete: 'CASCADE',
    },
    productId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(300), allowNull: true },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    salePrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    thumbnailImage: { type: DataTypes.TEXT, allowNull: true },
  });
  console.log('SaleEventRunProducts table created');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
