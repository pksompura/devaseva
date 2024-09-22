import express from 'express';
import { 
    createDonationCampaign, 
    deleteDonationCampaign, 
    getCampaignsByCategoryWithSearch, 
    getDonationCampaignById,  
    listDonationCampaigns, 
    updateDonationCampaign, 
    uploadTextEditorImage, // Include text editor image upload handler
    deleteTextEditorImage, // Include text editor image delete handler
    createCampaignWithLimitedFields,
    getDonationCampaignsByUser,
    updateCampaignWithLimitedFields,
    getCampaignById,
    listDonationCampaignsFalse,
    uploadBannerImage,
    updateBannerImage,
    deleteBannerImage,
    listBannerImages
} from '../controllers/campaign.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to create a new donation campaign
router.post('/add', createDonationCampaign);
router.post('/user/create-campaign', authenticateUser, createCampaignWithLimitedFields);
router.post('/user/update-campaign', authenticateUser, updateCampaignWithLimitedFields);
router.get('/user/campaigns', authenticateUser, getDonationCampaignsByUser);
router.get('/user/:id', authenticateUser, getCampaignById);
// Route to list all donation campaigns with pagination
router.get('/list', listDonationCampaigns);
router.get('/list-false', listDonationCampaignsFalse);

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

router.post('/banners/upload', uploadBannerImage);

// Route to update an existing banner image
router.put('/banners/update', updateBannerImage);

// Route to delete a banner image
router.delete('/banners/delete', deleteBannerImage);

// Route to list banner images (limit to 3)
router.get('/banners/list', listBannerImages);

export default router;
