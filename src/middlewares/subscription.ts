import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../types';
import logger from '../utils/logger';

const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME || '@slowuz';

const NOT_SUBSCRIBED_MESSAGE = `❌ Botdan foydalanish uchun avval kanalimizga obuna bo'ling!\n\n📢 Kanal: ${CHANNEL_USERNAME}\n\nObuna bo'lgandan so'ng qaytib keling va /start yuboring.`;

export const checkSubscription: MiddlewareFn<BotContext> = async (ctx, next) => {
  // Adminlarni tekshirmaslik
  if (ctx.isAdmin) return next();

  // Faqat message va callback_query uchun tekshirish
  if (!ctx.from) return next();

  try {
    const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
    const status = member.status;

    // left yoki kicked bo'lsa — obuna emas
    if (status === 'left' || status === 'kicked') {
      await ctx.reply(NOT_SUBSCRIBED_MESSAGE, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Kanalga obuna bo\'lish', url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}` }],
            [{ text: '✅ Obuna bo\'ldim', callback_data: 'check_subscription' }],
          ],
        },
      });
      return;
    }

    return next();
  } catch (err) {
    logger.error('Subscription check error:', err);
    // Xatolik bo'lsa o'tkazib yuborish (bot kanalda admin bo'lmasa)
    return next();
  }
};
