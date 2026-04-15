import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../types';
import { MESSAGES } from '../utils/messages';
import logger from '../utils/logger';

const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => parseInt(id.trim()))
  .filter(Boolean);

export const adminMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId && ADMIN_IDS.includes(userId)) {
    ctx.isAdmin = true;
  } else {
    ctx.isAdmin = false;
  }
  return next();
};

export const requireAdmin: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (!ctx.isAdmin) {
    logger.warn(`Unauthorized admin access attempt by user ${ctx.from?.id}`);
    await ctx.reply(MESSAGES.notAdmin, { parse_mode: 'Markdown' });
    return;
  }
  return next();
};

export const isAdmin = (telegramId: number): boolean => ADMIN_IDS.includes(telegramId);
