import express from 'express';
import { createEnquiry, updateEnquiry, deleteEnquiry } from '../controllers/enquiry.js';
// import { createEnquiry, updateEnquiry, deleteEnquiry, listEnquiries, getEnquiry } from '../controllers/enquiryController.js';

const router = express.Router();

// Route to create a new enquiry
router.post('/enquiries', createEnquiry);

// Route to update an existing enquiry
router.put('/enquiries/:id', updateEnquiry);

// Route to delete an enquiry
router.delete('/enquiries/:id', deleteEnquiry);



export default router;
