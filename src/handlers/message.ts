import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { handleMovieRequest } from './user';
import { handleAdminSession } from './admin';
import logger from '../utils/logger';

const MOVIE_CODE_REGEX = /^[A-Z0-9_-]{2,20}$/i;

export function registerMessageHandler(bot: Telegraf<BotContext>): void {
  bot.on('message', async (ctx) => {
    const message = ctx.message as any;
    const text: string | undefined = message?.text;

    // Skip commands
    if (text && text.startsWith('/')) return;

    // Handle admin session steps first (text + file uploads)
    if (ctx.isAdmin) {
      const handled = await handleAdminSession(ctx);
      if (handled) return;
    }

    // Handle video/document uploads (non-admin or outside session)
    if (message?.video || message?.document) {
      await ctx.reply('📁 Fayl qabul qilindi. Film kodini yuboring.', { parse_mode: 'Markdown' });
      return;
    }

    if (!text) return;

    // Check if the text matches a movie code pattern
    const trimmed = text.trim();
    if (MOVIE_CODE_REGEX.test(trimmed)) {
      logger.info(`Movie code search: "${trimmed}" by user ${ctx.from?.id}`);
      await handleMovieRequest(ctx, trimmed);
    } else {
      await ctx.reply(
        `🔍 Film kodi topilmadi.\n\n` +
        `📝 To'g'ri kod formatini kiriting (masalan: \`FILM001\`)\n` +
        `Yordam uchun /help buyrug'ini yuboring.`,
        { parse_mode: 'Markdown' }
      );
    }
  });
}
