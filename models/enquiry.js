import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequalize.js';

class Enquiry extends Model {}

Enquiry.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [10, 15], // Assuming phone number length between 10 to 15 digits
    },
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trust: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Enquiry',
  tableName: 'enquiries',
  timestamps: false,
});

export default Enquiry;
