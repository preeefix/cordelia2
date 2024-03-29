// Node Imports
const fs = require('fs');

// Discord Imports
const { Client, Collection, Intents } = require('discord.js');
const { discord, db } = require('./config.json');


// Discord Client Initialization
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

// Events Initialization
const eventFiles = fs.readdirSync(__dirname+'/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(__dirname+`/events/${file}`);
	if (event.once) {
		discordClient.once(event.name, (...args) => event.execute(...args));
	} else {
		discordClient.on(event.name, (...args) => event.execute(...args));
	}
}


// Command Initialization
discordClient.commands = new Collection();
const commandFiles = fs.readdirSync(__dirname+'/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(__dirname+`/commands/${file}`);
    discordClient.commands.set(command.data.name, command);
}


// Discord Login
discordClient.login(discord.token);