import { MiddlewareFn } from 'telegraf';
import { BotContext, SessionData } from '../types';

// In-memory session store (use Redis for production)
const sessions = new Map<string, SessionData>();

const getSessionKey = (ctx: BotContext): string => {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  return `${userId}:${chatId}`;
};

export const sessionMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const key = getSessionKey(ctx);
  ctx.session = sessions.get(key) || {};

  await next();

  if (ctx.session && Object.keys(ctx.session).length > 0) {
    sessions.set(key, ctx.session);
  } else {
    sessions.delete(key);
  }
};

export const clearSession = (ctx: BotContext): void => {
  ctx.session = {};
};
