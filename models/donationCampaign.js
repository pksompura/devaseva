// // models/DonationCampaign.js
// import { DataTypes, Model } from 'sequelize';
// import sequelize from '../db/sequalize.js';
// import CampaignImage from './donationCampaignImage.js';
// import DonationCategory from './donationCategory.js';


// class DonationCampaign extends Model {}

// DonationCampaign.init({
//   id: {
//     type: DataTypes.INTEGER,
//     autoIncrement: true,
//     primaryKey: true,
//   },
//   featured_image_base_url: DataTypes.STRING,
//   featured_image_path: DataTypes.STRING,
//   temple_name: DataTypes.STRING,
//   campaign_name: DataTypes.STRING,
//   description: DataTypes.TEXT,
//   short_name: DataTypes.STRING,
//   short_description: DataTypes.TEXT,
//   location: DataTypes.STRING,
//   event: DataTypes.STRING,
//   priority: DataTypes.INTEGER,
//   target_amount: DataTypes.DECIMAL(10, 2),
//   donated_amount: {
//     type: DataTypes.DECIMAL(10, 2),
//     defaultValue: 0.00,
//   },
//   start_date: DataTypes.DATEONLY,
//   expiry_date: DataTypes.DATE,
//   is_published: DataTypes.BOOLEAN,
//   is_expired: DataTypes.BOOLEAN,
//   tax_beneficiary: DataTypes.BOOLEAN,
//   billing_address: DataTypes.BOOLEAN,
//   about: DataTypes.TEXT,
//   is_active: DataTypes.BOOLEAN,
//   created_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
//   updated_at: {
//     type: DataTypes.DATE,
//     defaultValue: DataTypes.NOW,
//   },
//   slug: {
//     type: DataTypes.STRING,
//     unique: true,
//   },
//   row_pre_id: DataTypes.STRING(10),
//   is_anonymous: DataTypes.BOOLEAN,
//   is_whatsapp_update: DataTypes.BOOLEAN,
//   minimum_amount: DataTypes.DECIMAL(10, 2),
//   banner_image_id: DataTypes.INTEGER,
//   trust: DataTypes.STRING,
//   category_id: {
//     type: DataTypes.INTEGER,
//     references: {
//       model: DonationCategory,
//       key: 'id',
//     },
//     allowNull: true,
//   }, // Added field
// }, {
//   sequelize,
//   modelName: 'DonationCampaign',
//   tableName: 'donationCampaign',
//   timestamps: false,
// });

// DonationCampaign.associate = models => {
//   DonationCampaign.hasMany(models.Subdonation, { foreignKey: 'campaign_id', as: 'subdonations' });
//   DonationCampaign.hasMany(models.Donation, { foreignKey: 'donation_campaign_id' });
//   DonationCampaign.hasMany(CampaignImage, { foreignKey: 'donationCampaignId', as: 'images' });
  
//   // Association with DonationCategory
//   DonationCampaign.belongsTo(models.DonationCategory, { foreignKey: 'category_id', as: 'donationcategories' });
// };

// export default DonationCampaign;
import mongoose from 'mongoose';

const donationCampaignSchema = new mongoose.Schema({
  featured_image_base_url: String,
  featured_image_path: String,
  temple_name: String,
  campaign_name: String,
  description: String,
  short_name: String,
  short_description: String,
  location: String,
  event: String,
  priority: Number,
  target_amount: mongoose.Types.Decimal128,
  donated_amount: {
    type: mongoose.Types.Decimal128,
    default: 0.00,
  },
  start_date: Date,
  expiry_date: Date,
  is_published: Boolean,
  is_expired: Boolean,
  tax_beneficiary: Boolean,
  billing_address: Boolean,
  about: String,
  is_active: Boolean,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  slug: {
    type: String,
    unique: true,
  },
  row_pre_id: String,
  is_anonymous: Boolean,
  is_whatsapp_update: Boolean,
  minimum_amount: mongoose.Types.Decimal128,
  banner_image_id: mongoose.Schema.Types.ObjectId,
  trust: String,
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationCategory',
  },
});

const DonationCampaign = mongoose.model('DonationCampaign', donationCampaignSchema);

export default DonationCampaign;
