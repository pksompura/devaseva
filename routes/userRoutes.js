import express from 'express';
import { listUsers, logout, registerOrLoginUser, sendOTP, verifyOTP } from '../controllers/user.js';

const router = express.Router();

router.post('/sendOtp', sendOTP);
router.post('/verifyOtp', verifyOTP);
router.get('/get-all-users', listUsers);
router.post('/logout', logout);
router.post('/login', registerOrLoginUser);


export default router