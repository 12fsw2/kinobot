import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import { MovieAttributes } from '../types';

interface MovieCreationAttributes
  extends Optional<
    MovieAttributes,
    'id' | 'created_at' | 'views_count' | 'rating' | 'poster_url' | 'movie_file_id' | 'movie_url'
  > {}

class Movie extends Model<MovieAttributes, MovieCreationAttributes> implements MovieAttributes {
  public id!: number;
  public code!: string;
  public title!: string;
  public description!: string;
  public genre!: string;
  public rating?: number;
  public poster_url?: string;
  public movie_file_id?: string;
  public movie_url?: string;
  public views_count!: number;
  public created_at!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Movie.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      set(value: string) {
        this.setDataValue('code', value.toUpperCase());
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0, max: 10 },
    },
    poster_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    movie_file_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Telegram file_id for uploaded video files',
    },
    movie_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'External streaming URL',
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'movies',
    modelName: 'Movie',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Movie;
