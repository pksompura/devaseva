import { DataTypes, Model } from 'sequelize';
import sequelize from '../db/sequalize.js';

class Donation extends Model {}

Donation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  donated_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  donation_campaign_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'donationCampaign',
      key: 'id',
    },
  },
  // transaction_id: {
  //   type: DataTypes.STRING,
  //   allowNull: false,
  //   unique: true,
  // },
}, {
  sequelize,
  modelName: 'Donation',
  tableName: 'donations',
  timestamps: false,
});


export default Donation;
