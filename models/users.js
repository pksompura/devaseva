// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';


// class User extends Model {}

// User.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   first_name: {
//     type: DataTypes.STRING(100),
//     allowNull: true,
//   },
//   last_name: {
//     type: DataTypes.STRING(100),
//     allowNull: true,
//   },
//   email: {
//     type: DataTypes.STRING,
//     unique: true,
//     allowNull: true,
//   },
//   mobile_number: {
//     type: DataTypes.STRING(20),
//     unique: true,
//   },
//   address: {
//     type: DataTypes.TEXT,
//     allowNull: true, // Allow null values for address
//   },
//   profile_pic: {
//     type: DataTypes.STRING,
//     allowNull: true, // Allow null values for profile_pic
//   },
//   transactions: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: 'donations',
//       key: 'id',
//     },
//     allowNull: true, // Allow null values for transactions
//   },
//   otp: {
//     type: DataTypes.STRING(10),
//     allowNull: true, // Allow null values for otp
//   },
// },
// {
//   sequelize,
//   modelName: 'User',
//   tableName: 'users',
//   timestamps: false,
// });


// export default User;


// // F9TSA5P5DUV7L4R6NYHLJFU9

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  
  mobile_number: {
    type: String,
    unique: true,
  },
  address: String,
  profile_pic: String,
  transactions: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
  },
  otp: String,
});

const User = mongoose.model('User_donation', userSchema);

export default User;

 
