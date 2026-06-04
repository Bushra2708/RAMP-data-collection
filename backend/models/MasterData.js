import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MasterData = sequelize.define('MasterData', {
  _id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'id',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  items: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  freezeTableName: true,
});

export default MasterData;
