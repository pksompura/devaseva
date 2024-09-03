// // models/DonationCategory.js
// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';

// class DonationCategory extends Model {}

// DonationCategory.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true
//   },
//   name: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true
//   },
// }, {
//   sequelize,
//   modelName: 'DonationCategory',
//   tableName: 'donationcategories', // Ensure the table name matches exactly with your references
//   timestamps: false
// });

// export default DonationCategory;
import mongoose from 'mongoose';

const donationCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const DonationCategory = mongoose.model('DonationCategory', donationCategorySchema);

export default DonationCategory;
