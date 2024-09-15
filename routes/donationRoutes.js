import express from 'express';
import { 
    createDonationCampaign, 
    deleteDonationCampaign, 
    getCampaignsByCategoryWithSearch, 
    getDonationCampaignById,  
    listDonationCampaigns, 
    updateDonationCampaign, 
    uploadTextEditorImage, // Include text editor image upload handler
    deleteTextEditorImage // Include text editor image delete handler
} from '../controllers/campaign.js';

const router = express.Router();

// Route to create a new donation campaign
router.post('/add', createDonationCampaign);

// Route to list all donation campaigns with pagination
router.get('/list', listDonationCampaigns);

// Route to update a donation campaign by ID
router.post('/update/:id', updateDonationCampaign);

// Route to delete a donation campaign by ID
router.post('/delete/:id', deleteDonationCampaign);

// Route to get a donation campaign by ID
router.get('/get-by-id/:id', getDonationCampaignById);

// Route to fetch campaigns by category with search functionality
router.get('/campaigns/category/:category', getCampaignsByCategoryWithSearch);

// Route to upload an image from the text editor
router.post('/upload-text-editor-image', uploadTextEditorImage);

// Route to delete an image from the text editor
router.post('/delete-text-editor-image', deleteTextEditorImage);

export default router;
