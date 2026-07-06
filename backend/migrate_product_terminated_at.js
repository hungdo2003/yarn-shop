const { DataTypes } = require('sequelize');
const sequelize = require('./src/config/database');

(async () => {
  const q = sequelize.getQueryInterface();
  await q.addColumn('Products', 'terminatedAt', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });
  console.log('Products.terminatedAt added');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
