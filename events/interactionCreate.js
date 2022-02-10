module.exports = {
	name: 'interactionCreate',
	async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
    
        if (!command) return;
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);

            if (interaction.replied) {
                await interaction.editReply({ content: 'There was a transient error while executing the command', ephemeral: true })
                return;
            }
            await interaction.reply({ content: 'There was a transient error while executing the command', ephemeral: true });
        }
    },
};