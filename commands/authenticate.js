const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('auth')
		.setDescription('Replies with a `Pong!`'),
	canDefer: true,
	async execute(interaction) {
		await interaction.followUp('Pong!');
	},
};

