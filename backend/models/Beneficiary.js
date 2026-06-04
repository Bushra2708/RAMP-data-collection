import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Counsellor from './Counsellor.js';

const Beneficiary = sequelize.define('Beneficiary', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  beneficiaryId: {
    type: DataTypes.STRING,
    unique: true,
  },
  assignedCounsellorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Counsellor',
      key: 'id',
    },
  },
  personalInfo: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
  esdpTraining: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  entrepreneurProfile: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  dprTracking: {
    type: DataTypes.JSONB,
    defaultValue: { dprPrepared: 'No' },
  },
  loanTracking: {
    type: DataTypes.JSONB,
    defaultValue: { loanApplied: 'No' },
  },
  compliance: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  marketAccess: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  certifications: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  files: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  timeline: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  freezeTableName: true,
  indexes: [
    { fields: ['assignedCounsellorId'] },
    { fields: ['beneficiaryId'] },
    { fields: ['createdAt'] },
    { using: 'gin', fields: ['personalInfo'] },
    { using: 'gin', fields: ['entrepreneurProfile'] },
    { using: 'gin', fields: ['esdpTraining'] },
  ],
  hooks: {
    beforeCreate: async (beneficiary) => {
      if (!beneficiary.beneficiaryId) {
        const year = new Date().getFullYear();
        const count = await Beneficiary.count();
        const serial = String(count + 1).padStart(5, '0');
        beneficiary.beneficiaryId = `RBHMS-${year}-${serial}`;
        
        beneficiary.timeline = [{
          date: new Date(),
          title: 'Beneficiary Registered',
          description: `Beneficiary profile successfully created with ID: ${beneficiary.beneficiaryId}`,
          type: 'Registration',
        }];
      }
    },
  },
});

Beneficiary.belongsTo(Counsellor, { as: 'assignedCounsellor', foreignKey: 'assignedCounsellorId' });

export default Beneficiary;
