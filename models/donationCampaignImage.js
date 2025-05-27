// // src/models/CampaignImage.js
// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';
// import DonationCampaign from './donationCampaign.js';
 
// class CampaignImage extends Model {}

// CampaignImage.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   imageUrl: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   donationCampaignId: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     references: {
//       model: 'donationCampaign',
//       key: 'id',
//     },
//     onUpdate: 'CASCADE',
//     onDelete: 'CASCADE',
//   },
// }, {
//   sequelize,
//   modelName: 'CampaignImage',
//   tableName: 'campaign_images',
//   timestamps: false,
// });

// // CampaignImage.belongsTo(DonationCampaign, { foreignKey: 'donationCampaignId', as: 'campaign' });

// export default CampaignImage;


import mongoose from 'mongoose';

const campaignImageSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  donationCampaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCampaign',
    required: true,
  },
});

const CampaignImage = mongoose.model('CampaignImage', campaignImageSchema);

export default CampaignImage;
