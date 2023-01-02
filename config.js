/* eslint-disable no-inline-comments */

// Parse out any .env files.
require('dotenv').config();

module.exports = {
	token: process.env.TOKEN, // The Bot Token
	clientId: process.env.CLIENT_ID, // Client ID for registering commands
	guildId: process.env.GUILD_ID, // Guild ID for development registering of commands
	registerGuild: process.env.REG_GUILD, // Whether to register the commands globally or to the guild

	dbHost: process.env.DB_HOST,
	dbUser: process.env.DB_USER,
	dbPassword: process.env.DB_PASS,
	dbDatabase: process.env.DB_DATABASE,
};