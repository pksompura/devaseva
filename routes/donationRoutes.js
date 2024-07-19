import express from 'express';
import { createDonationCampaign, deleteDonationCampaign, listDonationCampaigns, updateDonationCampaign } from '../controllers/campaign.js';
 

const router = express.Router();

router.post('/add', createDonationCampaign);
router.get('/list', listDonationCampaigns);
router.post('/update/:id', updateDonationCampaign);
router.post('/delete/:id', deleteDonationCampaign);


export default router