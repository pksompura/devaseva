// models/DonationCampaign.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequalize.js';
import CampaignImage from './donationCampaignImage.js';

class DonationCampaign extends Model {}

DonationCampaign.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  featured_image_base_url: DataTypes.STRING,
  featured_image_path: DataTypes.STRING,
  temple_name: DataTypes.STRING,
  campaign_name: DataTypes.STRING,
  description: DataTypes.TEXT,
  short_name: DataTypes.STRING,
  short_description: DataTypes.TEXT,
  location: DataTypes.STRING,
  event: DataTypes.STRING,
  priority: DataTypes.INTEGER,
  target_amount: DataTypes.DECIMAL(10, 2),
  donated_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  start_date: DataTypes.DATEONLY,
  expiry_date: DataTypes.DATE,
  is_published: DataTypes.BOOLEAN,
  is_expired: DataTypes.BOOLEAN,
  tax_beneficiary: DataTypes.BOOLEAN,
  billing_address: DataTypes.BOOLEAN,
  about: DataTypes.TEXT,
  is_active: DataTypes.BOOLEAN,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
  },
  row_pre_id: DataTypes.STRING(10),
  is_anonymous: DataTypes.BOOLEAN,
  is_whatsapp_update: DataTypes.BOOLEAN,
  minimum_amount: DataTypes.DECIMAL(10, 2),
  banner_image_id: DataTypes.INTEGER,
  trust: DataTypes.STRING, // Added field
}, {
  sequelize,
  modelName: 'DonationCampaign',
  tableName: 'donationCampaign',
  timestamps: false, // Disable timestamps as createdAt and updatedAt are defined explicitly
});

DonationCampaign.associate = models => {
  DonationCampaign.hasMany(models.Subdonation, { foreignKey: 'campaign_slug', sourceKey: 'slug' });
DonationCampaign.hasMany(models.Donation, { foreignKey: 'donation_campaign_id' });
DonationCampaign.hasMany(CampaignImage, { foreignKey: 'donationCampaignId', as: 'images' });

};

export default DonationCampaign;
