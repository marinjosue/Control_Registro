require('dotenv').config();

const commonConfig = {
  logging: (msg) => console.log('[Sequelize]', msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    supportBigNumbers: true,
    bigNumberStrings: true
  }
};

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    dialect: 'mysql',
    ...commonConfig
  }, 
  railway: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    dialect: 'mysql',
    ...commonConfig
  }, 
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    dialect: 'mysql',
    ...commonConfig
  }
};
