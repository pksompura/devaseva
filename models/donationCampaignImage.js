// src/models/CampaignImage.js
import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequalize.js';
import DonationCampaign from './DonationCampaign.js';
class CampaignImage extends Model {}

CampaignImage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  donationCampaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'donationCampaign',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
}, {
  sequelize,
  modelName: 'CampaignImage',
  tableName: 'campaign_images',
  timestamps: false,
});

CampaignImage.belongsTo(DonationCampaign, { foreignKey: 'donationCampaignId', as: 'campaign' });

export default CampaignImage;
