// db/index.js
import pkg from 'pg';  // Import pg using CommonJS style
const { Pool } = pkg; 
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'


dotenv.config();

const currentDir = process.cwd();
const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Replace with your PostgreSQL username
  host: process.env.DB_HOST || 'localhost', // Replace with your PostgreSQL host
  database: process.env.DB_DATABASE || 'donation', // Replace with your PostgreSQL database name
  password: process.env.DB_PASSWORD || 'Chandu@88611', // Replace with your PostgreSQL password
  port: process.env.DB_PORT || 5432, // Replace with your PostgreSQL port
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTablesPath = path.join(currentDir, 'db', 'createTables.sql');

// Read SQL script content
const createTablesScript = fs.readFileSync(createTablesPath).toString();
// Function to create tables
async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(createTablesScript);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    client.release();
  }
}

createTables();  // Call createTables function when the file is loaded


export default pool;
