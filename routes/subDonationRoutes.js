import express from 'express';
import { createSubdonation, deleteSubdonation, updateSubdonation } from '../controllers/subDonation.js';


const router = express.Router();

router.post('/create', createSubdonation);
router.post('/update/:id', updateSubdonation);
router.get('/delete/:id', deleteSubdonation);


export default router