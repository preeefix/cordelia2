const Sequelize = require('sequelize');
const { db } = require('./config.json');
const fs = require('fs');
const path = require('path');

// Database Initialization
const sequelize = new Sequelize(db.database, db.username, db.password, {
    host: db.host,
    dialect: db.dialect,
    logging: db.logging,
    storage: db.storage,
});


var Models = {};
let modelDir = path.join(__dirname, 'models')

const modelFiles = fs.readdirSync(modelDir).filter(file => file.endsWith('.js'));
for (const file of modelFiles) {
    Models[file.slice(0,-3)] = require(`${modelDir}/${file}`)(sequelize, Sequelize.DataTypes);
}

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = { Models };
