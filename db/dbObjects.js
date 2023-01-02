const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');

// Import relevant configuration components
const { dbHost, dbUser, dbPassword, dbDatabase } = require('../config.js');
const { Collection } = require('discord.js');

// Initialize the configuration
const sequelize = new Sequelize(dbDatabase, dbUser, dbPassword, {
	host: dbHost,
	dialect: 'postgresql',
});

// Find all of the models
const modelsPath = path.join(__dirname, '..', 'db', 'models');
const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

const Models = new Collection();

for (const file of modelFiles) {
	const modelPath = path.join(modelsPath, file);
	Models.set(
		file.substring(0, file.indexOf('.')),
		require(modelPath)(sequelize, Sequelize.DataTypes),
	);
}

module.exports = { Models };