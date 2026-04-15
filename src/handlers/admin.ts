import { Telegraf, Markup } from 'telegraf';
import { BotContext } from '../types';
import { MovieService, StatsService } from '../bot/services';
import { MESSAGES, BUTTONS } from '../utils/messages';
import { requireAdmin } from '../middlewares/admin';
import { clearSession } from '../middlewares/session';
import logger from '../utils/logger';

const movieService = new MovieService();
const statsService = new StatsService();

const PAGE_SIZE = 5;

// Validation helpers
const isValidCode = (code: string): boolean => /^[A-Z0-9_-]{2,20}$/i.test(code);
const isValidRating = (r: string): boolean => {
  const n = parseFloat(r);
  return !isNaN(n) && n >= 1 && n <= 10;
};

export function registerAdminHandlers(bot: Telegraf<BotContext>): void {
  // Admin panel
  bot.command('admin', requireAdmin, async (ctx) => {
    await ctx.reply(MESSAGES.adminWelcome, { parse_mode: 'Markdown' });
  });

  // ─── /addmovie ──────────────────────────────────────────────────
  bot.command('addmovie', requireAdmin, async (ctx) => {
    ctx.session = { step: 'add_code', movieData: {} };
    await ctx.reply(MESSAGES.addMovie.start, { parse_mode: 'Markdown' });
  });

  // ─── /deletemovie ───────────────────────────────────────────────
  bot.command('deletemovie', requireAdmin, async (ctx) => {
    ctx.session = { step: 'delete_code' };
    await ctx.reply(MESSAGES.deleteMovie.prompt, { parse_mode: 'Markdown' });
  });

  // ─── /updatemovie ───────────────────────────────────────────────
  bot.command('updatemovie', requireAdmin, async (ctx) => {
    ctx.session = { step: 'update_code' };
    await ctx.reply(MESSAGES.updateMovie.promptCode, { parse_mode: 'Markdown' });
  });

  // ─── /listmovies ────────────────────────────────────────────────
  bot.command('listmovies', requireAdmin, async (ctx) => {
    await sendMovieList(ctx, 1);
  });

  // Pagination callbacks
  bot.action(/^list_page:(\d+)$/, requireAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await sendMovieList(ctx, page);
  });

  // ─── /stats ─────────────────────────────────────────────────────
  bot.command('stats', requireAdmin, async (ctx) => {
    try {
      const stats = await statsService.getStats();
      await ctx.reply(MESSAGES.stats(stats), { parse_mode: 'Markdown' });
    } catch (err) {
      logger.error('Stats error:', err);
      await ctx.reply(MESSAGES.error);
    }
  });

  // Delete confirm/cancel callbacks
  bot.action(/^confirm_delete:(.+)$/, requireAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    const code = ctx.match[1];
    const movie = await movieService.findByCode(code);
    if (!movie) {
      await ctx.editMessageText(MESSAGES.deleteMovie.notFound(code), { parse_mode: 'Markdown' });
      return;
    }
    const title = movie.title;
    await movieService.deleteMovie(code);
    clearSession(ctx);
    logger.info(`Admin ${ctx.from.id} deleted movie: ${code}`);
    await ctx.editMessageText(MESSAGES.deleteMovie.success(title), { parse_mode: 'Markdown' });
  });

  bot.action('cancel_delete', requireAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    clearSession(ctx);
    await ctx.editMessageText(MESSAGES.deleteMovie.cancel, { parse_mode: 'Markdown' });
  });

  // Update field selection
  bot.action(/^update_field:(.+)$/, requireAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    const field = ctx.match[1];
    ctx.session!.updateField = field;
    ctx.session!.step = 'update_value';
    await ctx.reply(MESSAGES.updateMovie.promptValue(field), { parse_mode: 'Markdown' });
  });

  bot.action('cancel_update', requireAdmin, async (ctx) => {
    await ctx.answerCbQuery();
    clearSession(ctx);
    await ctx.editMessageText(MESSAGES.cancelled, { parse_mode: 'Markdown' });
  });
}

async function sendMovieList(ctx: BotContext, page: number): Promise<void> {
  try {
    const result = await movieService.getMoviesPaginated({ page, pageSize: PAGE_SIZE });

    if (result.total === 0) {
      await ctx.reply(MESSAGES.listMovies.empty, { parse_mode: 'Markdown' });
      return;
    }

    const header = MESSAGES.listMovies.header(result.total, page, result.totalPages);
    const movieLines = result.items.map((m) => MESSAGES.listMovies.item(m)).join('\n\n');

    const navButtons: ReturnType<typeof Markup.button.callback>[] = [];
    if (page > 1) navButtons.push(Markup.button.callback(BUTTONS.prev, `list_page:${page - 1}`));
    if (page < result.totalPages) navButtons.push(Markup.button.callback(BUTTONS.next, `list_page:${page + 1}`));

    const keyboard = navButtons.length ? Markup.inlineKeyboard([navButtons]) : undefined;

    const text = `${header}\n\n${movieLines}`;

    if (keyboard) {
      await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
    } else {
      await ctx.reply(text, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    logger.error('List movies error:', err);
    await ctx.reply(MESSAGES.error);
  }
}

// ─── Session-based conversation handler ─────────────────────────────
export async function handleAdminSession(ctx: BotContext): Promise<boolean> {
  const step = ctx.session?.step;
  if (!step) return false;
  if (!ctx.isAdmin) return false;

  const text = (ctx as any).message?.text as string | undefined;
  const message = ctx.message as any;

  try {
    // ── ADD MOVIE FLOW ──
    if (step === 'add_code') {
      if (!text || !isValidCode(text)) {
        await ctx.reply(MESSAGES.invalidCode, { parse_mode: 'Markdown' });
        return true;
      }
      const exists = await movieService.codeExists(text);
      if (exists) {
        await ctx.reply(MESSAGES.addMovie.codeExists(text), { parse_mode: 'Markdown' });
        return true;
      }
      ctx.session!.movieData!.code = text.toUpperCase();
      ctx.session!.step = 'add_title';
      await ctx.reply(MESSAGES.addMovie.code, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_title') {
      if (!text) return true;
      ctx.session!.movieData!.title = text;
      ctx.session!.step = 'add_description';
      await ctx.reply(MESSAGES.addMovie.title, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_description') {
      if (!text) return true;
      ctx.session!.movieData!.description = text;
      ctx.session!.step = 'add_genre';
      await ctx.reply(MESSAGES.addMovie.description, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_genre') {
      if (!text) return true;
      ctx.session!.movieData!.genre = text;
      ctx.session!.step = 'add_rating';
      await ctx.reply(MESSAGES.addMovie.genre, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_rating') {
      if (text === '/skip') {
        ctx.session!.step = 'add_poster';
        await ctx.reply(MESSAGES.addMovie.rating, { parse_mode: 'Markdown' });
        return true;
      }
      if (!text || !isValidRating(text)) {
        await ctx.reply(MESSAGES.invalidRating, { parse_mode: 'Markdown' });
        return true;
      }
      ctx.session!.movieData!.rating = parseFloat(text);
      ctx.session!.step = 'add_poster';
      await ctx.reply(MESSAGES.addMovie.rating, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_poster') {
      if (text !== '/skip' && text) {
        ctx.session!.movieData!.poster_url = text;
      }
      ctx.session!.step = 'add_file';
      await ctx.reply(MESSAGES.addMovie.poster, { parse_mode: 'Markdown' });
      return true;
    }

    if (step === 'add_file') {
      // Check for video file
      if (message?.video) {
        ctx.session!.movieData!.movie_file_id = message.video.file_id;
      } else if (message?.document) {
        ctx.session!.movieData!.movie_file_id = message.document.file_id;
      } else if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        ctx.session!.movieData!.movie_url = text;
      } else {
        await ctx.reply('❌ Iltimos, video fayl yuboring yoki URL manzilini kiriting.');
        return true;
      }

      // Save movie
      const data = ctx.session!.movieData!;
      if (!data.code || !data.title || !data.description || !data.genre) {
        await ctx.reply('❌ Barcha majburiy maydonlar to\'ldirilmagan.');
        clearSession(ctx);
        return true;
      }

      const movie = await movieService.createMovie(data as any);
      clearSession(ctx);
      logger.info(`Admin ${ctx.from!.id} added movie: ${movie.code}`);
      await ctx.reply(MESSAGES.addMovie.success(movie.title), { parse_mode: 'Markdown' });
      return true;
    }

    // ── DELETE FLOW ──
    if (step === 'delete_code') {
      if (!text) return true;
      const movie = await movieService.findByCode(text);
      if (!movie) {
        await ctx.reply(MESSAGES.deleteMovie.notFound(text), { parse_mode: 'Markdown' });
        clearSession(ctx);
        return true;
      }
      ctx.session!.step = 'delete_confirm';
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback(BUTTONS.confirm, `confirm_delete:${movie.code}`),
        Markup.button.callback(BUTTONS.cancel, 'cancel_delete'),
      ]);
      await ctx.reply(MESSAGES.deleteMovie.confirm(movie.title, movie.code), {
        parse_mode: 'Markdown',
        ...keyboard,
      });
      return true;
    }

    // ── UPDATE FLOW ──
    if (step === 'update_code') {
      if (!text) return true;
      const movie = await movieService.findByCode(text);
      if (!movie) {
        await ctx.reply(MESSAGES.updateMovie.notFound(text), { parse_mode: 'Markdown' });
        clearSession(ctx);
        return true;
      }
      ctx.session!.updateCode = movie.code;
      ctx.session!.step = 'update_field_select';

      const fieldButtons = Object.entries(BUTTONS.updateFields).map(([key, label]) => [
        Markup.button.callback(label, `update_field:${key}`),
      ]);
      fieldButtons.push([Markup.button.callback(BUTTONS.cancel, 'cancel_update')]);

      await ctx.reply(MESSAGES.updateMovie.selectField(movie.title), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(fieldButtons),
      });
      return true;
    }

    if (step === 'update_value') {
      if (!text || !ctx.session!.updateCode || !ctx.session!.updateField) return true;

      const field = ctx.session!.updateField;
      const code = ctx.session!.updateCode;
      let value: any = text;

      if (field === 'rating') {
        if (!isValidRating(text)) {
          await ctx.reply(MESSAGES.invalidRating, { parse_mode: 'Markdown' });
          return true;
        }
        value = parseFloat(text);
      }

      const [count, [updatedMovie]] = await movieService.updateMovie(code, { [field]: value });
      clearSession(ctx);

      if (count === 0) {
        await ctx.reply(MESSAGES.updateMovie.notFound(code), { parse_mode: 'Markdown' });
        return true;
      }

      logger.info(`Admin ${ctx.from!.id} updated movie ${code} field: ${field}`);
      await ctx.reply(MESSAGES.updateMovie.success(updatedMovie.title), { parse_mode: 'Markdown' });
      return true;
    }

    return false;
  } catch (err) {
    logger.error('Admin session error:', err);
    clearSession(ctx);
    await ctx.reply(MESSAGES.error);
    return true;
  }
}
