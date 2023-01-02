// Acquire the Node Bits
const fs = require('node:fs');
const path = require('node:path');

// Acquire the Discord.JS Bits
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// Create the Discord.JS client instance
const discordClient = new Client({ intents: [ GatewayIntentBits.Guilds ] });

const { token } = require('./config.js');

// Command Import
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

discordClient.commands = new Collection();
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	// Add the commands to the collection (if they're valid)
	if ('data' in command && 'execute' in command) {
		discordClient.commands.set(command.data.name, command);
		console.debug(`[DEBUG] Registered handler for event: ${command.name}`);
	} else {
		console.warn(`[WARN] The file at ${filePath} is not recognized as a valid command.`);
	}
}

// Event Import
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if ('name' in event && 'once' in event && 'execute' in event) {
		if (event.once) {
			discordClient.once(event.name, (...args) => event.execute(...args));
		} else {
			discordClient.on(event.name, (...args) => event.execute(...args));
		}

		console.debug(`[DEBUG] Registered handler for event: ${event.name}`);
	} else {
		console.warn(`[WARN] The file at ${filePath} is not recognized as a valid event.`);
	}
}

// Log-in to Discord
discordClient.login(token);