import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Beneficiary from './Beneficiary.js';

const BeneficiaryDocument = sequelize.define('BeneficiaryDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  category: {
    type: DataTypes.ENUM(
      'Personal Documents',
      'Enterprise Documents',
      'Registration Documents',
      'Scheme Documents',
      'Financial Documents',
      'Market Access Documents',
      'Other Documents'
    ),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  public_id: {
    type: DataTypes.STRING,
  },
  original_filename: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  format: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uploadedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  uploadedByRole: {
    type: DataTypes.ENUM('Admin', 'Counsellor'),
    allowNull: false,
  },
}, {
  freezeTableName: true,
  indexes: [
    { fields: ['beneficiary_id'] },
  ],
});

// Relationships
BeneficiaryDocument.belongsTo(Beneficiary, { as: 'beneficiaryRecord', foreignKey: 'beneficiary_id' });

export default BeneficiaryDocument;
