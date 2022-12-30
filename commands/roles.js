const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Message } = require('discord.js');

const { Guild, User } = require('../database.js').Models;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roles')
		.setDescription('Because defining things in a config file is a pain!')
		.addSubcommand( subcommand =>
            subcommand
                .setName('guest')
                .setDescription('Set guild level options')
                .addUserOption(option => option
                    .setName('guest_user')
                    .setDescription('The user to add the Guest role to.')
                    .setRequired(true)
                )
        )
		.addSubcommand( subcommand => subcommand
            .setName('region')
            .setDescription('The region you would like to be shown as.')
            .addStringOption( option => option
                .setName('region')
                .setDescription('The region you\'re in.')
                .setRequired(true)
                .addChoice('EMEA', 'emea')
                .addChoice('AMER-East', 'east')
                .addChoice('AMER-Central', 'central')
                .addChoice('AMER-West', 'west')
                .addChoice('APAC', 'apac')
            )
        ),
	async execute(interaction) {
		if(!interaction.commandName === "roles") return;

        console.debug("## Roles Interaction")

        // Make these easier to access
        let subcommand = interaction.options.getSubcommand();

        // Guest Flow
        if (subcommand === 'guest') {

            let mentionedUser = interaction.options.getMember('guest_user');

            if (mentionedUser == null) {
                return await interaction.reply({ content: "The mentioned user", ephemeral: true })
            }

            // Retrieve Current Configuration
            const guildConfig = await Guild.findOne({ where: { guild_id: `${interaction.guildId}` }});

            // Check to see if the configuration for the server exists
            if (!guildConfig.internal_role_id || !guildConfig.external_role_id) {
                return await interaction.reply({ content: `This server hasn't been configured for guest roles.`, ephemeral: true });
            }

            // Only internal users can assign the external role
            if (!interaction.member.roles.cache.has(guildConfig.internal_role_id)) {
                return await interaction.reply({
                    content: `You are not a privliged user and cannot assign the <@&${guildConfig.external_role_id}> role to another user.`,
                    ephemeral: true
                })
            }

            // Don't allow assigning the external role to internal users
            if (mentionedUser.roles.cache.has(guildConfig.internal_role_id)) {
                return await interaction.reply({
                    content: `You can't assign an internal user, the external role.`,
                    ephemeral: true
                })
            }

            // Don't assign the role to users that already have the role
            if (mentionedUser.roles.cache.has(guildConfig.external_role_id)) {
                return await interaction.reply({
                    content: `You can't assing the external role to a user that already has it.`,
                    ephemeral: true
                })
            }

            // Phew, too many edge cases when it comes to roles...

            mentionedUser.roles.add(guildConfig.external_role_id);

            return await interaction.reply({
                content: `<@${mentionedUser.id}> was given the <@&${guildConfig.external_role_id}> role.`,
                ephemeral: true
            })
        }
	},
};
