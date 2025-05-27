// db/sequelize.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = 'postgresql://devaseva_user:Oar58ox0gCgBGx0G4ZdxXPXfJrjqR5l3@dpg-cr8ijgq3esus73b7987g-a.oregon-postgres.render.com/devaseva';

let sequelize;

if (!sequelize) {
  console.log('Connecting to database:', databaseUrl); // Debug log for verifying the URL

  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Render's PostgreSQL usually requires SSL
      }
    },
    logging: console.log,  
  });
}

export default sequelize;

// db/sequelize.js
// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// dotenv.config();

// const sequelize = new Sequelize({
//   host: process.env.DB_HOST  ,
//   database: process.env.DB_DATABASE ,
//   username: process.env.DB_USER ,
//   password: process.env.DB_PASSWORD  ,
//   dialect: 'postgres',
//   dialectOptions: {
//     ssl: false, // Disable SSL
//   },
//   logging: console.log,  
// });

// export default sequelize;
