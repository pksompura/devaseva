import Donation from '../models/donation.js';
import DonationCampaign from '../models/donationCampaign.js';
import CampaignImage from '../models/donationCampaignImage.js';
import Enquiry from '../models/enquiry.js';
import Subdonation from '../models/subdonation.js';
import User from '../models/users.js';
import sequelize from './sequalize.js';
 
 
async function createTables() {


    try {
      await DonationCampaign.sync();
      await Subdonation.sync();
      await Donation.sync();
      await User.sync();
      await CampaignImage.sync();
      await Enquiry.sync();

    
      console.log('Tables synced successfully');
    } catch (error) {
      console.error('Error syncing tables:', error);
    } 
  }
  

  export default createTables;