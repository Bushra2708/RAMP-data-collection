import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Beneficiary from './Beneficiary.js';

const BeneficiaryDocument = sequelize.define('BeneficiaryDocument', {
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
  publicId: {
    type: DataTypes.STRING,
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
});

// Relationships
BeneficiaryDocument.belongsTo(Beneficiary, { as: 'beneficiaryRecord', foreignKey: 'beneficiary_id' });

export default BeneficiaryDocument;
