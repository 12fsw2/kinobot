import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/connection';
import { UserAttributes } from '../types';

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'username'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public telegram_id!: number;
  public first_name!: string;
  public username?: string;
  public created_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default User;
