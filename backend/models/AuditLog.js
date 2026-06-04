import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userIdentifier: {
    // email for Admin, mobile for Counsellor
    type: DataTypes.STRING,
    allowNull: true,
  },
  userRole: {
    type: DataTypes.ENUM('Admin', 'Counsellor', 'System'),
    allowNull: false,
    defaultValue: 'System',
  },
  action: {
    // e.g. LOGIN, CREATE_BENEFICIARY, UPDATE_BENEFICIARY, UPLOAD_DOCUMENT, etc.
    type: DataTypes.STRING,
    allowNull: false,
  },
  entity: {
    // e.g. Beneficiary, Document, Activity, Auth
    type: DataTypes.STRING,
    allowNull: true,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    // Contextual info or diff
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    // SUCCESS or FAILURE
    type: DataTypes.ENUM('SUCCESS', 'FAILURE'),
    defaultValue: 'SUCCESS',
  },
}, {
  freezeTableName: true,
  updatedAt: false, // Only created_at needed for logs
});

export default AuditLog;
