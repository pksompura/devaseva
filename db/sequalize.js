// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// dotenv.config();

// const sequelize = new Sequelize({
//   dialect: 'postgres',
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 5432,
//   username: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'Chandu@88611',
//   database: process.env.DB_DATABASE || 'donation',
//   dialectOptions: {
//     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
//   },
// });

// export default sequelize;

// db/sequelize.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

if (!sequelize) {
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Chandu@88611',
    database: process.env.DB_DATABASE || 'donation',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    logging: console.log, // Enable logging to debug connection issues
  });
}

export default sequelize;
