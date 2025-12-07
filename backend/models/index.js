'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env] || require(__dirname + '/../config/config.js')['production'];

const db = {};
let sequelize;

if (config && config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else if (config) {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
} else {
    throw new Error(`Configuration for environment "${env}" not found. Check your config.js file.`);
}
// Carga todos los modelos automáticamente
fs
    .readdirSync(__dirname)
    .filter(file =>
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js'
    )
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });

// Ejecuta las asociaciones si existen
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
