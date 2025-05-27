import express from 'express';
import { createEnquiry, updateEnquiry, deleteEnquiry, getEnquiries } from '../controllers/enquiry.js';
// import { createEnquiry, updateEnquiry, deleteEnquiry, listEnquiries, getEnquiry } from '../controllers/enquiryController.js';

const router = express.Router();

router.post('/create', createEnquiry);
router.put('/update/:id', updateEnquiry);
router.delete('/delete/:id', deleteEnquiry);
router.get('/list', getEnquiries);



export default router;
