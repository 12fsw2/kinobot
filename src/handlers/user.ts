import { Telegraf, Markup } from 'telegraf';
import { BotContext } from '../types';
import { MovieService, UserService, StatsService } from '../bot/services';
import { MESSAGES } from '../utils/messages';
import logger from '../utils/logger';

const movieService = new MovieService();
const userService = new UserService();

const PAGE_SIZE = 5;

export function registerUserHandlers(bot: Telegraf<BotContext>): void {
  // /start command
  bot.start(async (ctx) => {
    const firstName = ctx.from.first_name;
    logger.info(`/start from user ${ctx.from.id} (@${ctx.from.username})`);
    await ctx.reply(MESSAGES.welcome(firstName), { parse_mode: 'Markdown' });
  });

  // /help command
  bot.help(async (ctx) => {
    await ctx.reply(MESSAGES.help, { parse_mode: 'Markdown' });
  });

  // /genres command
  bot.command('genres', async (ctx) => {
    try {
      const args = ctx.message.text.split(' ').slice(1).join(' ').trim();

      if (args) {
        // Filter by genre
        const result = await movieService.getMoviesByGenre(args, { page: 1, pageSize: PAGE_SIZE });
        if (result.total === 0) {
          await ctx.reply(MESSAGES.noMoviesInGenre(args), { parse_mode: 'Markdown' });
          return;
        }

        await ctx.reply(MESSAGES.genreMovies(args, result.total), { parse_mode: 'Markdown' });

        for (const movie of result.items) {
          const keyboard = Markup.inlineKeyboard([
            Markup.button.callback(`🎬 Ko'rish (${movie.code})`, `view_movie:${movie.code}`),
          ]);
          await ctx.reply(
            `🎬 *${movie.title}*\n🎭 ${movie.genre} | 👁 ${movie.views_count} ko'rish`,
            { parse_mode: 'Markdown', ...keyboard }
          );
        }

        if (result.totalPages > 1) {
          await ctx.reply(
            `📄 Sahifa 1/${result.totalPages}. Keyingisi uchun: /genres ${args} 2`
          );
        }
      } else {
        const genres = await movieService.getAllGenres();
        if (genres.length === 0) {
          await ctx.reply('📭 Hozircha janrlar yo\'q.');
          return;
        }
        const keyboard = Markup.inlineKeyboard(
          genres.map((g) => [Markup.button.callback(g, `genre_filter:${g}`)]),
        );
        await ctx.reply(MESSAGES.genresList(genres), { parse_mode: 'Markdown', ...keyboard });
      }
    } catch (err) {
      logger.error('Genres error:', err);
      await ctx.reply(MESSAGES.error, { parse_mode: 'Markdown' });
    }
  });

  // Inline callback: genre filter
  bot.action(/^genre_filter:(.+)$/, async (ctx) => {
    const genre = ctx.match[1];
    await ctx.answerCbQuery();
    const result = await movieService.getMoviesByGenre(genre, { page: 1, pageSize: PAGE_SIZE });

    if (result.total === 0) {
      await ctx.reply(MESSAGES.noMoviesInGenre(genre), { parse_mode: 'Markdown' });
      return;
    }

    await ctx.reply(MESSAGES.genreMovies(genre, result.total), { parse_mode: 'Markdown' });
    for (const movie of result.items) {
      await ctx.reply(
        `🎬 *${movie.title}* (\`${movie.code}\`)\n` +
        `🎭 ${movie.genre} | ⭐ ${movie.rating || 'N/A'} | 👁 ${movie.views_count}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            Markup.button.callback('🎬 Olish', `view_movie:${movie.code}`),
          ]),
        }
      );
    }
  });

  // Inline callback: view movie by code
  bot.action(/^view_movie:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const code = ctx.match[1];
    await handleMovieRequest(ctx, code);
  });
}

export async function handleMovieRequest(ctx: BotContext, code: string): Promise<void> {
  try {
    const movie = await movieService.findByCode(code);
    if (!movie) {
      await ctx.reply(MESSAGES.movieNotFound(code), { parse_mode: 'Markdown' });
      return;
    }

    // Get user for view tracking
    const user = await userService.findByTelegramId(ctx.from!.id);
    if (user) {
      await movieService.recordView(user.id, movie.id);
    }

    // Send poster if available
    if (movie.poster_url) {
      try {
        await ctx.replyWithPhoto(movie.poster_url, {
          caption: MESSAGES.movieInfo(movie),
          parse_mode: 'Markdown',
        });
      } catch {
        await ctx.reply(MESSAGES.movieInfo(movie), { parse_mode: 'Markdown' });
      }
    } else {
      await ctx.reply(MESSAGES.movieInfo(movie), { parse_mode: 'Markdown' });
    }

    // Send movie file or link
    if (movie.movie_file_id) {
      await ctx.reply(MESSAGES.movieFile, { parse_mode: 'Markdown' });
      await ctx.replyWithVideo(movie.movie_file_id);
    } else if (movie.movie_url) {
      await ctx.reply(MESSAGES.movieLink(movie.movie_url), { parse_mode: 'Markdown' });
    }

    logger.info(`Movie "${movie.code}" sent to user ${ctx.from!.id}`);
  } catch (err) {
    logger.error('Movie request error:', err);
    await ctx.reply(MESSAGES.error);
  }
}
