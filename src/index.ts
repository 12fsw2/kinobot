import 'dotenv/config';
import { connectDatabase } from './database/connection';
import './models/index'; // register all models & associations
import { createBot } from './bot/bot';
import logger from './utils/logger';

async function main() {
  try {
    logger.info('🚀 Starting Telegram Movie Bot...');

    // Connect to PostgreSQL
    await connectDatabase();

    // Sync models (creates tables if they don't exist)
    const sequelize = (await import('./database/connection')).default;
    await sequelize.sync({ alter: true });
    logger.info('✅ Database models synchronized.');

    // Create and launch bot
    const bot = createBot();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      bot.stop(signal);
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    await bot.launch();
    logger.info(`✅ Bot is running! Username: @${bot.botInfo?.username}`);
  } catch (error) {
    logger.error('❌ Fatal startup error:', error);
    process.exit(1);
  }
}

main();
