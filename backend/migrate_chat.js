require('dotenv').config();
const { sequelize } = require('./src/models');

(async () => {
  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ChatConversations_status') THEN
        CREATE TYPE "enum_ChatConversations_status" AS ENUM ('open','active','closed');
      END IF;
    END $$;
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "ChatConversations" (
      id SERIAL PRIMARY KEY,
      "customerId" INTEGER NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
      "staffId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      status "enum_ChatConversations_status" DEFAULT 'open',
      "lastMessageAt" TIMESTAMPTZ DEFAULT NOW(),
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_chat_conv_customer ON "ChatConversations"("customerId")`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_chat_conv_status ON "ChatConversations"(status)`);

  await sequelize.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ChatMessages_senderRole') THEN
        CREATE TYPE "enum_ChatMessages_senderRole" AS ENUM ('customer','staff','bot');
      END IF;
    END $$;
  `);
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "ChatMessages" (
      id SERIAL PRIMARY KEY,
      "conversationId" INTEGER NOT NULL REFERENCES "ChatConversations"(id) ON DELETE CASCADE,
      "senderId" INTEGER REFERENCES "Users"(id) ON DELETE SET NULL,
      "senderRole" "enum_ChatMessages_senderRole" NOT NULL,
      content TEXT NOT NULL,
      "isRead" BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON "ChatMessages"("conversationId")`);

  console.log('Chat tables ready');
  await sequelize.close();
})();
