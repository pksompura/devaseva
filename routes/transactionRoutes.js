import express from 'express';
import { 
    createOrder, 
    verifyPayment, 
    getDonationsByUser, 
    getDonationsByCampaign, 
    getDonationsByTransactionId 
} from '../controllers/paymentController.js';

const router = express.Router();

// Routes
router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/donations/user/:userId', getDonationsByUser);
router.get('/donations/campaign/:campaignId', getDonationsByCampaign);
router.get('/donations/transaction/:paymentId', getDonationsByTransactionId);

export default router;
