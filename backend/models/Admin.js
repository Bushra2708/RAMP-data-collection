import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Admin',
    validate: {
      isIn: [['Admin', 'Manager']],
    },
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
  },
}, {
  freezeTableName: true,
  hooks: {
    beforeCreate: async (admin) => {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
  },
});

// Instance method to compare password
Admin.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default Admin;
