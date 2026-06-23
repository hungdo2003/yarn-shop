require('dotenv').config();
const sequelize = require('./database');
require('../models');

const force = process.argv.includes('--force');
const alter = !force && process.argv.includes('--alter');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected.');
    await sequelize.sync({ force, alter });
    if (force) console.log('All tables dropped and recreated.');
    else if (alter) console.log('All tables altered to match models.');
    else console.log('All tables synced (no changes to existing tables).');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
})();
