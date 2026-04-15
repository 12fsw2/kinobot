import { Context } from 'telegraf';

export interface BotContext extends Context {
  session?: SessionData;
  isAdmin?: boolean;
}

export interface SessionData {
  step?: string;
  movieData?: Partial<MovieInput>;
  updateCode?: string;
  updateField?: string;
  page?: number;
}

export interface MovieInput {
  code: string;
  title: string;
  description: string;
  genre: string;
  rating?: number;
  poster_url?: string;
  movie_file_id?: string;
  movie_url?: string;
}

export interface MovieAttributes {
  id: number;
  code: string;
  title: string;
  description: string;
  genre: string;
  rating?: number;
  poster_url?: string;
  movie_file_id?: string;
  movie_url?: string;
  views_count: number;
  created_at: Date;
}

export interface UserAttributes {
  id: number;
  telegram_id: number;
  first_name: string;
  username?: string;
  created_at: Date;
}

export interface ViewAttributes {
  id: number;
  user_id: number;
  movie_id: number;
  viewed_at: Date;
}

export interface StatsResult {
  totalUsers: number;
  totalMovies: number;
  topMovies: Array<{ title: string; code: string; views_count: number }>;
  topGenres: Array<{ genre: string; count: number }>;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
