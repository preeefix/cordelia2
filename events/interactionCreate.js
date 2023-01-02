const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			console.info(`[INFO] Command Received: ${interaction.commandName}`);
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.warn(`[WARN] No command matching ${interaction.commandName}.`);
			}

			try {
				// Defer the response (if we can)
				if (command.canDefer) {
					await interaction.deferReply({ ephemeral: true });
				}
				await command.execute(interaction);
			} catch (error) {
				console.error(`[ERROR] There was an issue processing ${interaction.commandName}.`);
				console.error(error);

				await interaction.followUp({ content: 'There wan an issue processing your command.', ephemeral: true });
			}
		} else {
			return;
		}
	},
};
