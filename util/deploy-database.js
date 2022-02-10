const Sequelize = require('sequelize');
const fs = require('fs');
const { db } = require('../config.json');

const sequelize = new Sequelize(db.database, db.username, db.password, {
	host: db.host,
	dialect: db.dialect,
	logging: db.logging,
	storage: db.storage, // SQLite specific.
});

const modelFiles = fs.readdirSync('../models').filter(file => file.endsWith('.js'));
for (const file of modelFiles) {
    require(`../models/${file}`)(sequelize, Sequelize.DataTypes);
}

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);
