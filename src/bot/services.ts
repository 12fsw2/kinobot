import { Op, fn, col, literal } from 'sequelize';
import { Movie, User, View } from '../models';
import { MovieInput, PaginatedResult, PaginationOptions, StatsResult } from '../types';
import logger from '../utils/logger';

export class MovieService {
  async findByCode(code: string): Promise<Movie | null> {
    return Movie.findOne({ where: { code: code.toUpperCase() } });
  }

  async createMovie(data: MovieInput): Promise<Movie> {
    return Movie.create({
      ...data,
      code: data.code.toUpperCase(),
    });
  }

  async updateMovie(code: string, updates: Partial<MovieInput>): Promise<[number, Movie[]]> {
    return Movie.update(updates, {
      where: { code: code.toUpperCase() },
      returning: true,
    });
  }

  async deleteMovie(code: string): Promise<number> {
    return Movie.destroy({ where: { code: code.toUpperCase() } });
  }

  async incrementViews(movieId: number): Promise<void> {
    await Movie.increment('views_count', { by: 1, where: { id: movieId } });
  }

  async recordView(userId: number, movieId: number): Promise<void> {
    await View.create({ user_id: userId, movie_id: movieId });
    await this.incrementViews(movieId);
  }

  async getMoviesPaginated(options: PaginationOptions): Promise<PaginatedResult<Movie>> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Movie.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    return {
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getMoviesByGenre(genre: string, options: PaginationOptions): Promise<PaginatedResult<Movie>> {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await Movie.findAndCountAll({
      where: { genre: { [Op.iLike]: `%${genre}%` } },
      order: [['views_count', 'DESC']],
      limit: pageSize,
      offset,
    });

    return {
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  async getAllGenres(): Promise<string[]> {
    const movies = await Movie.findAll({
      attributes: [[fn('DISTINCT', col('genre')), 'genre']],
      order: [['genre', 'ASC']],
    });
    return movies.map((m) => m.genre);
  }

  async codeExists(code: string): Promise<boolean> {
    const count = await Movie.count({ where: { code: code.toUpperCase() } });
    return count > 0;
  }
}

export class UserService {
  async findOrCreate(
    telegramId: number,
    firstName: string,
    username?: string
  ): Promise<[User, boolean]> {
    return User.findOrCreate({
      where: { telegram_id: telegramId },
      defaults: {
        telegram_id: telegramId,
        first_name: firstName,
        username,
      },
    });
  }

  async updateUser(telegramId: number, data: Partial<{ first_name: string; username: string }>): Promise<void> {
    await User.update(data, { where: { telegram_id: telegramId } });
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return User.findOne({ where: { telegram_id: telegramId } });
  }
}

export class StatsService {
  async getStats(): Promise<StatsResult> {
    const [totalUsers, totalMovies, topMoviesRaw, topGenresRaw] = await Promise.all([
      User.count(),
      Movie.count(),
      Movie.findAll({
        order: [['views_count', 'DESC']],
        limit: 5,
        attributes: ['title', 'code', 'views_count'],
      }),
      Movie.findAll({
        attributes: ['genre', [fn('COUNT', col('id')), 'count']],
        group: ['genre'],
        order: [[literal('count'), 'DESC']],
        limit: 5,
        raw: true,
      }),
    ]);

    const topMovies = topMoviesRaw.map((m) => ({
      title: m.title,
      code: m.code,
      views_count: m.views_count,
    }));

    const topGenres = (topGenresRaw as any[]).map((g) => ({
      genre: g.genre,
      count: parseInt(g.count),
    }));

    logger.info('Stats fetched successfully');

    return { totalUsers, totalMovies, topMovies, topGenres };
  }
}
