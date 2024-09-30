import express from 'express';
import { deleteUser, getUserProfile, listUsers, logout, registerOrLoginUser, sendOTP, updateUserInfo, verifyOTP } from '../controllers/user.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/sendOtp', sendOTP);
router.post('/verifyOtp', verifyOTP);
router.get('/get-all-users', listUsers);
router.post('/logout', logout);
router.post('/login', registerOrLoginUser);
router.post('/update',authenticateUser,updateUserInfo );
router.get('/get-user-profile',authenticateUser,getUserProfile );
router.delete('/delete/:id',authenticateUser,deleteUser );


export default router