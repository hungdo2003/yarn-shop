require('dotenv').config();
const { sequelize } = require('./src/models');

const run = async () => {
  const qi = sequelize.getQueryInterface();
  const cols = await qi.describeTable('Orders');
  if (!cols['shippingMethod']) {
    await sequelize.query(`DO $$ BEGIN CREATE TYPE "public"."enum_Orders_shippingMethod" AS ENUM('standard','express','economy'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await sequelize.query(`ALTER TABLE "Orders" ADD COLUMN "shippingMethod" "public"."enum_Orders_shippingMethod" DEFAULT 'standard';`);
    console.log('Added shippingMethod column');
  } else {
    console.log('shippingMethod already exists');
  }
  process.exit(0);
};
run().catch(e => { console.error(e.message); process.exit(1); });
