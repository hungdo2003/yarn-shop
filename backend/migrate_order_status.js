require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST, port: process.env.DB_PORT || 5432, dialect: 'postgres', logging: false
});

async function run() {
  const qi = sequelize.getQueryInterface();
  try {
    // Add new ENUM values to Orders status (PostgreSQL requires ALTER TYPE)
    const newValues = ['pending_payment', 'paid', 'delivered'];
    for (const val of newValues) {
      try {
        await sequelize.query(`ALTER TYPE "enum_Orders_status" ADD VALUE IF NOT EXISTS '${val}'`);
        console.log(`Added ENUM value: ${val}`);
      } catch (e) {
        console.log(`Skipping ${val}: ${e.message}`);
      }
    }

    // Add paidAt column to Payments if not exists
    try {
      const cols = await qi.describeTable('Payments');
      if (!cols.paidAt) {
        await qi.addColumn('Payments', 'paidAt', { type: Sequelize.DATE, allowNull: true });
        console.log('Added Payments.paidAt');
      }
      if (!cols.transactionId) {
        await qi.addColumn('Payments', 'transactionId', { type: Sequelize.STRING(100), allowNull: true });
        console.log('Added Payments.transactionId');
      }
    } catch (e) { console.log('Payments columns:', e.message); }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await sequelize.close();
  }
}

run();
