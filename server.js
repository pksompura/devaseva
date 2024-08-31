// src/server.js
import express from 'express';
import bodyParser from 'body-parser';
import path from "path"
import cors from 'cors';
import sequelize from './db/sequalize.js';
import createTables from './db/createTables.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import enquiryRoutes from './routes/enquiry.js';
import subDonationRoutes from './routes/subDonationRoutes.js';
import categoryRoutes from "./routes/category.js"
import { fileURLToPath } from 'url';
const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));
// Routes
app.use('/api/users', userRoutes);
app.use('/api/donation_campaign', donationRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/subDonation', subDonationRoutes);
app.use('/api/category', categoryRoutes);

// Database Connection
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database connected');
    return createTables(); 
  })
  .then(() => {
    console.log('Tables created successfully');
  })
  .catch(err => {
    console.error('Unable to connect to the database or create tables:', err);
  });

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
