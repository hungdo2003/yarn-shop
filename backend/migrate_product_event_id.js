require('dotenv').config();
const { sequelize } = require('./src/models');
const { DataTypes } = require('sequelize');

(async () => {
  const q = sequelize.getQueryInterface();

  try {
    await q.addColumn('Products', 'saleEventId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'SaleEvents', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    console.log('✓ Added saleEventId to Products');
  } catch (e) { console.log('- saleEventId already exists:', e.message); }

  await sequelize.close();
  console.log('Migration complete.');
})();
