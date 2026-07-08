require('dotenv').config();
const { sequelize } = require('./src/models');
const { DataTypes } = require('sequelize');

(async () => {
  const q = sequelize.getQueryInterface();

  try {
    await q.addColumn('Products', 'saleStartDate', { type: DataTypes.DATE, allowNull: true });
    console.log('✓ Added saleStartDate to Products');
  } catch (e) { console.log('- saleStartDate already exists'); }

  try {
    await q.addColumn('Products', 'saleEndDate', { type: DataTypes.DATE, allowNull: true });
    console.log('✓ Added saleEndDate to Products');
  } catch (e) { console.log('- saleEndDate already exists'); }

  await sequelize.close();
  console.log('Migration complete.');
})();
