// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';

// class Donation extends Model {}

// Donation.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   donated_date: {
//     type: DataTypes.DATEONLY,
//     defaultValue: DataTypes.NOW,
//   },
//   total_amount: {
//     type: DataTypes.DECIMAL(10, 2),
//     allowNull: false,
//   },
//   donation_campaign_id: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: 'donationCampaign',
//       key: 'id',
//     },
//   },
//   // transaction_id: {
//   //   type: DataTypes.STRING,
//   //   allowNull: false,
//   //   unique: true,
//   // },
//   // user_id: {
//   //   type: DataTypes.INTEGER,
//   //   references: {
//   //     model: 'users',
//   //     key: 'id',
//   //   },
//   //   allowNull: false,
//   // },
//   // paid: {
//   //   type: DataTypes.BOOLEAN,
//   //   defaultValue: false,
//   //   allowNull: false,
//   // },
// }, {
//   sequelize,
//   modelName: 'Donation',
//   tableName: 'donations',
//   timestamps: false,
// });


// export default Donation;


import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  donated_date: {
    type: Date,
    default: Date.now,
  },
  total_amount: {
    type: mongoose.Types.Decimal128,
    required: true,
  },
  donation_campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCampaign',
  },
  // Uncomment if needed
  // transaction_id: {
  //   type: String,
  //   required: true,
  //   unique: true,
  // },
  // user_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true,
  // },
  // paid: {
  //   type: Boolean,
  //   default: false,
  //   required: true,
  // },
});

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
