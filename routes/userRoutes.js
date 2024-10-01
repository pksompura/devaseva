import express from 'express';
import { deleteUser, getSettings, getUserProfile, listUsers, logout, registerOrLoginUser, sendOTP, updateSettings, updateUserInfo, verifyOTP } from '../controllers/user.js';
import { authenticateAdmin, authenticateUser } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/update-settings',authenticateUser, updateSettings);
router.get('/get-settings',authenticateUser, getSettings);
router.post('/sendOtp', sendOTP);
router.post('/verifyOtp', verifyOTP);
router.get('/get-all-users', listUsers);
router.post('/logout', logout);
router.post('/login', registerOrLoginUser);
router.post('/update',authenticateUser,updateUserInfo );
router.get('/get-user-profile',authenticateUser,getUserProfile );
router.delete('/delete/:id',authenticateUser,deleteUser );

export default router