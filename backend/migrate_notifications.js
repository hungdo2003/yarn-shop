require('dotenv').config();
const { sequelize } = require('./src/models');

(async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Notifications" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT,
      data JSONB DEFAULT '{}',
      "isRead" BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON "Notifications"("userId", "isRead")`);
  console.log('Notifications table ready');
  await sequelize.close();
})();
