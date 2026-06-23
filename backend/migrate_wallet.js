require('dotenv').config();
const { sequelize } = require('./src/models');
const { DataTypes } = require('sequelize');

(async () => {
  const q = sequelize.getQueryInterface();

  try {
    await q.addColumn('Users', 'walletBalance', { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 });
    console.log('✓ Added walletBalance to Users');
  } catch (e) { console.log('- walletBalance already exists'); }

  try {
    await sequelize.query("ALTER TYPE \"enum_Payments_method\" ADD VALUE IF NOT EXISTS 'wallet'");
    console.log('✓ Added wallet to enum_Payments_method');
  } catch (e) { console.log('- wallet enum:', e.message); }

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "WalletTransactions" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id),
        type VARCHAR(30) NOT NULL CHECK (type IN ('topup','payment','refund','admin_adjustment')),
        amount DECIMAL(15,2) NOT NULL,
        "balanceBefore" DECIMAL(15,2) NOT NULL,
        "balanceAfter" DECIMAL(15,2) NOT NULL,
        "orderId" INTEGER,
        description VARCHAR(255),
        reference VARCHAR(100),
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✓ WalletTransactions table ready');
  } catch (e) { console.log('- WalletTransactions:', e.message); }

  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "WalletTopups" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "Users"(id),
        amount DECIMAL(15,2) NOT NULL,
        "orderCode" BIGINT NOT NULL UNIQUE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','cancelled')),
        "checkoutUrl" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✓ WalletTopups table ready');
  } catch (e) { console.log('- WalletTopups:', e.message); }

  await sequelize.close();
  console.log('Migration complete.');
})();
