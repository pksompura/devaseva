import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import connectDB from './db/db.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import enquiryRoutes from './routes/enquiry.js';
import subDonationRoutes from './routes/subDonationRoutes.js';
import categoryRoutes from './routes/category.js';

connectDB();
const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const allowedOrigins = [
  'https://giveaze.com',
  'https://admin.giveaze.com',
  'http://localhost:5173',
  'http://localhost:5174',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent with requests
};

// Middleware
app.use(cors(corsOptions));

// Body parser configuration to handle large image/file uploads
app.use(express.json({ limit: '50mb' })); // Allows larger JSON payloads (e.g., large base64 images)
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Allows large URL-encoded form data

// Static file serving for images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/donation_campaign', donationRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/subDonation', subDonationRoutes);
app.use('/api/category', categoryRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
