import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';

const Counsellor = sequelize.define('Counsellor', {
  _id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'id',
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  freezeTableName: true,
  hooks: {
    beforeCreate: async (counsellor) => {
      const salt = await bcrypt.genSalt(10);
      counsellor.password = await bcrypt.hash(counsellor.password, salt);
    },
    beforeUpdate: async (counsellor) => {
      if (counsellor.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        counsellor.password = await bcrypt.hash(counsellor.password, salt);
      }
    },
  },
});

// Instance method to compare password
Counsellor.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default Counsellor;
