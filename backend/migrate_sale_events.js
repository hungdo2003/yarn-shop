require('dotenv').config();
const { sequelize } = require('./src/models');
const { DataTypes } = require('sequelize');

(async () => {
  const q = sequelize.getQueryInterface();

  try {
    await q.createTable('SaleEvents', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: DataTypes.STRING(200), allowNull: false },
      discountPct: { type: DataTypes.INTEGER, allowNull: true },
      saleStartDate: { type: DataTypes.DATE, allowNull: true },
      saleEndDate: { type: DataTypes.DATE, allowNull: true },
      productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      selectAll: { type: DataTypes.BOOLEAN, defaultValue: false },
      productIds: { type: DataTypes.JSONB, allowNull: true },
      isRemoval: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdBy: { type: DataTypes.INTEGER, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    console.log('✓ Created SaleEvents table');
  } catch (e) { console.log('- SaleEvents table already exists:', e.message); }

  await sequelize.close();
  console.log('Migration complete.');
})();
