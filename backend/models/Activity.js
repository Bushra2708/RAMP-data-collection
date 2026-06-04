import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Beneficiary from './Beneficiary.js';
import Counsellor from './Counsellor.js';

const Activity = sequelize.define('Activity', {
  _id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'id',
  },
  beneficiary: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'beneficiary_id',
    references: {
      model: 'Beneficiary',
      key: 'id',
    },
  },
  activityDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  counsellorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  counsellorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'counsellor_id',
    references: {
      model: 'Counsellor',
      key: 'id',
    },
  },
  supportCategory: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Rejected'),
    defaultValue: 'Not Started',
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  nextFollowUpDate: {
    type: DataTypes.DATE,
  },
}, {
  freezeTableName: true,
});

// Relationships
Activity.belongsTo(Beneficiary, { as: 'beneficiaryRecord', foreignKey: 'beneficiary_id' });
Activity.belongsTo(Counsellor, { as: 'counsellor', foreignKey: 'counsellor_id' });

export default Activity;
