import express from 'express';
import { listUsers, sendOTP, verifyOTP } from '../controllers/user.js';

const router = express.Router();

router.post('/sendOtp', sendOTP);
router.post('/verifyOtp', verifyOTP);
router.get('/get-all-users', listUsers);


export default router