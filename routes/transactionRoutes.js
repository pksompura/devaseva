import express from 'express';
import { 
    createOrder, 
    verifyPayment, 
    getDonationsByUser, 
    getDonationsByCampaign, 
    getDonationsByTransactionId, 
    getAllTransactions,
    getTransactionsByDate,
    downloadDonationReceipt
} from '../controllers/transactions.js'

const router = express.Router();

// Routes
router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.get('/donations/user/:userId', getDonationsByUser);
router.get('/donations/campaign/:campaignId', getDonationsByCampaign);
router.get('/donations/transaction/:paymentId', getDonationsByTransactionId);
router.get('/transactions', getAllTransactions);  
router.get('/transactions/export', getTransactionsByDate);  
router.get('/receipt', downloadDonationReceipt);
export default router;
