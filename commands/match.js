const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('match')
		.setDescription('Replies with a `Pong!`'),
	canDefer: false,
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};

