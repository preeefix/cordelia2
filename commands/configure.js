const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');

const { Guild, User } = require('../database.js').Models;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('configure')
		.setDescription('Because defining things in a config file is a pain!')
		.addSubcommand( subcommand =>
            subcommand
                .setName('guild')
                .setDescription('Set guild level options')
                .addChannelOption( option => option.setName('matching_lobby_id').setDescription('Match - Lobby Channel ID' ))
                .addChannelOption( option => option.setName('matching_team1_id').setDescription('Match - Team 1 Channel ID' ))
                .addChannelOption( option => option.setName('matching_team2_id').setDescription('Match - Team 2 Channel ID' ))
        )
		.addSubcommand( subcommand =>
            subcommand
                .setName('user')
                .setDescription('Set user level options')
                .addStringOption( option => option.setName('riot_id').setDescription('Riot ID - Ex: qmarchi#GOOGL'))
		),
	async execute(interaction) {
		
        if(!interaction.commandName === "configure") return;

        console.debug("## Configure Interaction")

        // Make these easier to access
        let subcommand = interaction.options.getSubcommand();

        // Guild Subcommand
        if (subcommand === 'guild') {

            // This is a long op...
            await interaction.deferReply();
            
            // Retrieve the responses, even if null
            let lobby = interaction.options.getChannel('matching_lobby_id')
            let team1 = interaction.options.getChannel('matching_team1_id')
            let team2 = interaction.options.getChannel('matching_team2_id')

            // Filter out null responses
            let lobbyId = (lobby ? lobby.id : undefined);
            let team1Id = (team1 ? team1.id : undefined);
            let team2Id = (team2 ? team2.id : undefined);

            // Commit updated to the database
            let updatedGuild = await Guild.upsert({
                guild_id: interaction.guildId,
                matching_lobby_id: lobbyId,
                matching_team1_id: team1Id,
                matching_team2_id: team2Id,
            }, { returning: true });


            // Retrieve Current Configuration
            const guildConfig = await Guild.findOne({ where: { guild_id: `${interaction.guildId}` }});

            const configEmbed = new MessageEmbed()
                .setTitle("Current Guild Configuration")
                .setAuthor(`Guild ID: ${guildConfig.guild_id}`)
                .addFields(
                    { name: 'Lobby Channel', value: `<#${guildConfig.matching_lobby_id}>`, inline: true },
                    { name: 'Team 1 Channel', value: `<#${guildConfig.matching_team1_id}>`, inline: true },
                    { name: 'Team 2 Channel', value: `<#${guildConfig.matching_team2_id}>`, inline: true },
                )

            await interaction.followUp({ embeds: [configEmbed] });
            return;
        }

        if (subcommand === 'user') {
            // This is a long op...
            await interaction.deferReply();

            // Retrieve the responses, even if null
            let riotResponse = interaction.options.getString('riot_id');

            // Resolve
            let riotId = (riotResponse ? riotResponse : undefined);

            let updatedUser = await User.upsert({
                user_id: interaction.member.id,
                riot_id: riotId,
            }, { returning: true });

            await interaction.editReply({ content: "User was updated!", ephemeral: true })
            return;
        }
	},
};
