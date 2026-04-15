import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../types';
import { UserService } from '../bot/services';
import logger from '../utils/logger';

const userService = new UserService();

export const userTrackingMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  if (ctx.from) {
    try {
      const [, created] = await userService.findOrCreate(
        ctx.from.id,
        ctx.from.first_name,
        ctx.from.username
      );
      if (!created) {
        // Update name/username if changed
        await userService.updateUser(ctx.from.id, {
          first_name: ctx.from.first_name,
          username: ctx.from.username,
        });
      }
      if (created) {
        logger.info(`New user registered: ${ctx.from.id} (@${ctx.from.username})`);
      }
    } catch (err) {
      logger.error('User tracking error:', err);
    }
  }
  return next();
};
