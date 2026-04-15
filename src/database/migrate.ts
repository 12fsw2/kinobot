import 'dotenv/config';
import sequelize from './connection';
import '../models/index';
import logger from '../utils/logger';

async function migrate() {
  try {
    logger.info('🔄 Running database migrations...');
    await sequelize.sync({ alter: true });
    logger.info('✅ Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
