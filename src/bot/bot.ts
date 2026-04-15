import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { adminMiddleware } from '../middlewares/admin';
import { userTrackingMiddleware } from '../middlewares/userTracking';
import { sessionMiddleware } from '../middlewares/session';
import { registerUserHandlers } from '../handlers/user';
import { registerAdminHandlers } from '../handlers/admin';
import { registerMessageHandler } from '../handlers/message';
import logger from '../utils/logger';

export function createBot(): Telegraf<BotContext> {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN is not set in environment variables');

  const bot = new Telegraf<BotContext>(token);

  // ─── Global error handler ────────────────────────────────────────
  bot.catch((err, ctx) => {
    logger.error(`Bot error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Kutilmagan xatolik yuz berdi. Iltimos qayta urinib ko\'ring.').catch(() => {});
  });

  // ─── Middleware chain ────────────────────────────────────────────
  bot.use(sessionMiddleware);
  bot.use(userTrackingMiddleware);
  bot.use(adminMiddleware);

  // ─── Register command/message handlers ──────────────────────────
  registerUserHandlers(bot);
  registerAdminHandlers(bot);
  registerMessageHandler(bot);

  return bot;
}
