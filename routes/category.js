import express from 'express';
import { createDonationCategory, deleteDonationCategory, listDonationCategories, updateDonationCategory } from '../controllers/category.js';
 

const router = express.Router();

router.post('/add', createDonationCategory);
router.get('/list', listDonationCategories);
router.post('/update', updateDonationCategory);
router.post('/delete/:id', deleteDonationCategory);



export default router