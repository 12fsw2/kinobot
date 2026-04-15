import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import { ViewAttributes } from '../types';
import User from './User';
import Movie from './Movie';

interface ViewCreationAttributes extends Optional<ViewAttributes, 'id' | 'viewed_at'> {}

class View extends Model<ViewAttributes, ViewCreationAttributes> implements ViewAttributes {
  public id!: number;
  public user_id!: number;
  public movie_id!: number;
  public viewed_at!: Date;
}

View.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    movie_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'movies', key: 'id' },
    },
    viewed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'views',
    modelName: 'View',
    timestamps: false,
  }
);

// Associations
User.hasMany(View, { foreignKey: 'user_id', as: 'views' });
View.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Movie.hasMany(View, { foreignKey: 'movie_id', as: 'views' });
View.belongsTo(Movie, { foreignKey: 'movie_id', as: 'movie' });

export default View;
