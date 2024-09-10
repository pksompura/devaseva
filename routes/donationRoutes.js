import express from 'express';
import { 
    createDonationCampaign , 
    deleteDonationCampaign , 
     getCampaignsByCategory, 
     getDonationCampaignById ,  
     listDonationCampaigns , 
      updateDonationCampaign 
    } from '../controllers/campaign.js';
 

const router = express.Router();

router.post('/add', createDonationCampaign);
router.get('/list', listDonationCampaigns);
router.post('/update/:id', updateDonationCampaign);
router.post('/delete/:id', deleteDonationCampaign);
router.get('/get-by-id/:id', getDonationCampaignById);
router.get('/campaigns/category/:category', getCampaignsByCategory);


export default router