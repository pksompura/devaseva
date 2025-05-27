// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';

// class Enquiry extends Model {}

// Enquiry.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   email: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique:true,
//     validate: {
//       isEmail: true,
//     },
//   },
//   number: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique:true,
//     validate: {
//       isNumeric: true,
//       len: [10, 15], // Assuming phone number length between 10 to 15 digits
//     },
//   },
//   purpose: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   trust: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
// }, {
//   sequelize,
//   modelName: 'Enquiry',
//   tableName: 'enquiries',
//   timestamps: false,
// });

// export default Enquiry;
import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    },
  },
  number: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid number!`
    },
  },
  purpose: String,
  trust: String,
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;
