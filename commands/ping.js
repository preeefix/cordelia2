const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with a `Pong!`'),
	canDefer: true,
	async execute(interaction) {
		await interaction.followUp('Pong!');
	},
};

