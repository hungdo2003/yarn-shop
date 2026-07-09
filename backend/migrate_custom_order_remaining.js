require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST, port: process.env.DB_PORT || 5432, dialect: 'postgres', logging: false
});

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    // Add new ENUM value for remaining_paid status
    await sequelize.query(`ALTER TYPE "enum_CustomOrders_status" ADD VALUE IF NOT EXISTS 'remaining_paid'`);
    console.log('Added ENUM value: remaining_paid');

    // Add remainingPaidAt column if not exists
    const cols = await qi.describeTable('CustomOrders');
    if (!cols.remainingPaidAt) {
      await qi.addColumn('CustomOrders', 'remainingPaidAt', { type: Sequelize.DATE, allowNull: true });
      console.log('Added CustomOrders.remainingPaidAt');
    } else {
      console.log('CustomOrders.remainingPaidAt already exists');
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
