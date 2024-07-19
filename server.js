// src/server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import sequelize from './db/sequalize.js';
import createTables from './db/createTables.js';
import userRoutes from './routes/userRoutes.js';
import donationRoutes from './routes/donationRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/donation_campaign', donationRoutes);

// Database Connection
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL database connected');
    return createTables(); // Ensure tables are created after DB connection is established
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
