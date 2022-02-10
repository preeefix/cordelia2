const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const { Op } = require('sequelize');
const { Guild, Matches, Rankings } = require('../database.js').Models;
const { rating, rate, ordinal } = require('openskill');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('match')
		.setDescription('All thaings matchmaking')
        .addSubcommand( subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a matchmaking session')
                .addBooleanOption( option => option.setName('voice').setDescription('Add all users in current voice channel' ))
        )
        .addSubcommand( subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an in progress match')
                .addIntegerOption( option =>
                    option
                        .setName('match_id')
                        .setDescription('The Match Idenftifier' )
                        .setRequired(true) )
        )
        .addSubcommand( subcommand => 
            subcommand
                .setName('swap')
                .setDescription("Swap a single player to the other team.")
                .addUserOption( option => 
                    option
                        .setName('mentioned_user')
                        .setDescription('The user to swap the team of.')
                        .setRequired(true)
                )
                .addIntegerOption( option =>
                    option
                        .setName('match_id')
                        .setDescription('The match ID for the match')
                        .setRequired(true)
                    )
        )
        .addSubcommand( subcommand => 
            subcommand
                .setName('resolve')
                .setDescription("Resolve a match and recalculate rankings.")
                .addStringOption( option => 
                    option
                        .setName('winning_team')
                        .setDescription('The team that won the match')
                        .setRequired(true)
                        .addChoice('Team 1', 'team1')
                        .addChoice('Team 2', 'team2')
                )
                .addIntegerOption( option =>
                    option
                        .setName('match_id')
                        .setDescription('The match ID for the match')
                        .setRequired(true)
                    )
        )
        .addSubcommandGroup( subcommandgroup =>
            subcommandgroup
                .setName('voice')
                .setDescription('Control match voice channels')
                .addSubcommand( subcommand =>
                    subcommand
                        .setName('collapse')
                        .setDescription("Merge the two team chats into one")
                )
                .addSubcommand( subcommand =>
                    subcommand
                        .setName('split')
                        .setDescription("Split the teams into two chats")
                        .addIntegerOption( option =>
                            option
                                .setName('match_id')
                                .setDescription('Match ID for team resolution')
                                .setRequired(true)
                        )
                )
        ),
	async execute(interaction) {

        if (!interaction.commandName === "match") return;

        console.debug("## Match Interaction")

        // Make this easier to access
        let subcommand = interaction.options.getSubcommand();

        // Create Match Subcommand
        if (subcommand === 'create') {

            // TODO: Actually implement non-voice user collection (mentions?)
            // if (!interaction.options.getBoolean('voice')) {
            //     await interaction.reply({ content: "Non-voice matchmaking is currently unavailable!", ephemeral: true });
            //     return;
            // }

            // Validate that the user is in a voice channel
            const matchingChannel = interaction.member.voice.channel;
            if (!matchingChannel) {
                await interaction.reply({ content: "You need to be in a voice channel to run this command!", ephemeral: true }, )
                return;
            }

            if (matchingChannel.members.length < 2) {
                await interaction.reply({ content: "You need more than one person to be able to generate a team mapping.", ephemeral: true });
                return;
            }

            let userRanks = [];

            // Lookup user's ranks from the db
            for ( [snowflake, member] of matchingChannel.members) {
                let memberRank = await Rankings.findOrCreate({
                    where: { user_id: member.id, guild_id: interaction.guildId }
                });
                console.log(`Ranking Lookup: ${member.user.tag} - ${memberRank[0].ordinal} - created: ${memberRank[1]}`);
                userRanks.push({ user_id: member.id, mu: memberRank[0].mu, sigma: memberRank[0].sigma, ordinal:memberRank[0].ordinal })
            }
            
            // Sort based on ordinal,
            userRanks.sort((rank1, rank2) => rank2.mu - rank1.mu);

            // Functions are fine right here, right?
            function calculateTeamScore(team) {
                let sum = 0;
                for (let p = 0; p < team.length; p++) {
                  sum = sum + team[p].mu;
                }
                return sum;
            }

            // Loop through all of the users and perform balancing
            let team1 = [];
            let team1score = 0;
            let team2 = [];
            let team2score = 0;

            for (user of userRanks) {
                team1score = calculateTeamScore(team1);
                team2score = calculateTeamScore(team2);

                if (team1.length >= 5) {
                    team2.push(user);
                } else if (team2.length >= 5) {
                    team1.push(user);
                } else {
                    if (team1score < team2score) {
                        team1.push(user);
                    } else {
                        team2.push(user)
                    }
                }
            }

            // One last time for stats
            team1score = calculateTeamScore(team1);
            team2score = calculateTeamScore(team2);

            // Pretty Log Printing....
            console.log(`Team 1: ${team1score}`);
            console.log(team1);
            console.log(`Team 2: ${team2score}`);
            console.log(team2);
            console.log();
            console.log(`Ordinal Diff: ${team1score - team2score}`);

            // Upload the match to the db
            const match = await Matches.create({
                initiator_id: interaction.member.id,
                team1: JSON.stringify(team1),
                team1score,
                team2: JSON.stringify(team2),
                team2score,
            }, {returning: true});

            // Building for the team fields later
            function generateTeamString(team) {
                let result = '';
                for (user of team) {
                    result += `- <@${user.user_id}> (${user.ordinal.toFixed(2)}) \n`
                }
                return result;
            }

            // Making things look Pretty
            const matchCreatedEmbed = new MessageEmbed()
                .setColor('#DC143C')
                .setTitle('Match Created')
                .setDescription(`Match ID: ${match.match_id}`)
                .addFields(
                    { name: `Team 1 - ~${team1score.toFixed(2)}`, value: generateTeamString(team1), inline: true },
                    { name: `Team 2 - ~${team2score.toFixed(2)}`, value: generateTeamString(team2), inline: true },
                )
                .setFooter('Powered by Cordelia. Built with <3 in Longmont.')

            await interaction.reply({ embeds: [matchCreatedEmbed] })
            return;
        }

        // Delete Match Subcommand
        if (subcommand === 'delete') {

            // Some sanity checking
            if (!interaction.options.getInteger('match_id')) {
                await interaction.reply({ content: 'The match ID is a requried attribute.', ephemeral: true });
                return;
            }

            const matchId = interaction.options.getInteger('match_id');

            let match = await Matches.findOne({ where: { match_id: matchId }});

            if (!match.active) {
                await interaction.reply({ content: 'The match ID supplied is already inactive.', ephemeral: true})
                return;
            }

            match.active = false
            await match.save();

            await interaction.reply({ content: "The match was successfully marked inactive.", ephemeral: true });
            return;
        }

        // Resolve Match Subcommand
        if (subcommand === 'resolve') {

            // Some sanity checking
            if (!interaction.options.getInteger('match_id')) {
                await interaction.reply('The match ID is a requried attribute.');
                return;
            }

            if (!interaction.options.getString('winning_team')) {
                await interaction.reply('The winning team is a required attribute.')
                return;
            }

            // Retrieve our values from Discord
            const matchId = interaction.options.getInteger('match_id');
            const winningTeam = interaction.options.getString('winning_team');

            // Find the existing match
            let match = await Matches.findOne({ where: { match_id: matchId, active: true } });


            if (match === null) {
                await interaction.reply("The match ID provided is invalid.");
                return;
            }

            let team1 = JSON.parse(match.team1)
            let team2 = JSON.parse(match.team2)

            if (winningTeam === "team2") {
                let swap = team1;
                team1 = team2;
                team2 = swap;
            }

            // Do the needful and revert
            const [team1ratings, team2ratings] = rate([team1, team2]);
            

            for (let count = 0; count < team1.length; count ++) {
                console.log(team1ratings[count]);
                team1[count].mu = team1ratings[count].mu;
                team1[count].sigma = team1ratings[count].sigma;
                team1[count].ordinal = ordinal(team1ratings[count]);
            }

            for (let count = 0; count < team2.length; count ++) {
                team2[count].mu = team2ratings[count].mu;
                team2[count].sigma = team2ratings[count].sigma;
                team2[count].ordinal = ordinal(team2ratings[count]);
            }

            // TODO: Add in wins+matches participated
            // Team 1 Rank Updates
            for (user of team1) {
                Rankings.update({ sigma: user.sigma, mu: user.mu, ordinal: user.ordinal},{
                    where: {
                        user_id: user.user_id,
                        guild_id: interaction.guildId,
                    }
                })
            }

            // Team 2 Rank Updates
            for (user of team2) {
                Rankings.update({ sigma: user.sigma, mu: user.mu, ordinal: user.ordinal},{
                    where: {
                        user_id: user.user_id,
                        guild_id: interaction.guildId,
                    }
                })
            }


            match.active = false;
            match.winner = winningTeam;
            await match.save();

            await interaction.reply({ content: "The match has been recorded. Thanks! "});
            return;
        }

        // Rank lookup Command
        if (subcommand === 'lookup') {

            const mentionedUser = interaction.options.getUser('mentioned_user' || interaction.member.user);

            const matchCount = await Matches.count({
                where: {
                    [Op.or]: [
                        { team1: {
                            [Op.like]: `%${mentionedUser.id}%`
                        }},
                        { team2: {
                            [Op.like]: `%${mentionedUser.id}%`
                        }}
                        ]
                    }
                });

            const userRanking = await Rankings.findOne({ where: { user_id: mentionedUser.id, guild_id: interaction.guildId }}); 

            const rankingLookupEmbed = new MessageEmbed()
                .setTitle(`Ranking for <@${mentionedUser.id}>`)
                .addFields([
                    { name: "Ranking", value: `~${userRanking.ordinal.toFixed(2)}`, inline:true },
                    { name: "Matches Played", value: `${matchCount}` },
                    { name: "Wins/Losses", value: `Coming soon!` },
                ]);
            
            await interaction.reply({ embeds: [rankingLookupEmbed], ephemeral: true });
            return;
        }

        if (subcommand === 'leaderboard') {

        }

        // Resolve Match Subcommand
        if (subcommand === 'swap') {
            
            // Some sanity checking
            if (!interaction.options.getInteger('match_id')) {
                await interaction.reply({ content: 'The match ID is a requried attribute.', ephemeral: true });
                return;
            }

            let matchID = interaction.options.getInteger('match_id');

            if (!interaction.options.getUser('mentioned_user')) {
                await interaction.reply({ content: 'Mentioning a user is required.', ephemeral: true })
                return;
            }

            let mentionedUser = interaction.options.getUser('mentioned_user');

            // Find the match that they're talking about.
            let match = await Matches.findOne({ where: { match_id: matchID, active: true }})

            if (!match) {
                await interaction.reply({ content: "The match ID provided either doesn't exist or is inactive."})
                return;
            }

            // [{user_ID: ~, sigma: ~, mu: ~, ordinal: ~},{...}]
            let team1 = JSON.parse(match.team1);
            let team2 = JSON.parse(match.team2);

            let team1new = [];
            let team2new = [];

            for (user of team1) {
                if (user.user_id == mentionedUser.id) {
                    team2new.push(user);
                } else {
                    team1new.push(user);
                }
            }

            for (user of team2) {
                if (user.user_id == mentionedUser.id) {
                    team1new.push(user);
                } else {
                    team2new.push(user);
                }
            }

            match.team1 = JSON.stringify(team1new);
            match.team2 = JSON.stringify(team2new);
            await match.save();

            await interaction.reply({ content: `The user <@${mentionedUser.id}> was moved to the other team.`})
            return;
        }

        // Just to make sure that we're not missing something.
        let subcommandGroup = interaction.options.getSubcommandGroup();

        // Voice Subgroup
        if (subcommandGroup === 'voice') {
            
            // Fetch the Channel IDs from the DB
            const guildConfig = await Guild.findOne({ where: { guild_id: `${interaction.guildId}` }});
            
            if (!guildConfig) {
                await interaction.reply({ content: "This Server isn't configured for voice control. Try using `/configure guild` first!"});
                return;
            }

            // Bind all of the channels
            // TODO: Get all of these to run at the same time. Ideally, they're all in the cache, but just to be sure.
            const lobbyChannel = await interaction.client.channels.fetch(guildConfig.matching_lobby_id);
            const team1Channel = await interaction.client.channels.fetch(guildConfig.matching_team1_id);
            const team2Channel = await interaction.client.channels.fetch(guildConfig.matching_team2_id);

            // Indescrimitately merge the team channels to a "Lobby" channel
            if (subcommand === 'collapse') {
                team1Channel.members.each(member => member.voice.setChannel(lobbyChannel));
                team2Channel.members.each(member => member.voice.setChannel(lobbyChannel));

                await interaction.reply({ content: `Players have been moved to ${lobbyChannel}`, ephemeral: true });
                return;
            }

            if (subcommand === 'split') {

                if (!interaction.options.getInteger('match_id')) {
                    await interaction.reply('The match ID is a requried attribute.');
                    return;
                }

                const matchId = interaction.options.getInteger('match_id');

                var match = await Matches.findOne({ where: { match_id: matchId, active: true }});

                if (!match) {
                    await interaction.reply({ content: "The match ID that you provided is invalid.", ephemeral: true});
                    return;
                }

                let team1 = JSON.parse(match.team1);
                let team2 = JSON.parse(match.team2);

                for (matchUser of team1) {
                    let discordUser = await interaction.guild.members.cache.find( user => user.id === matchUser.user_id);
                    discordUser.voice.setChannel(team1Channel);
                }
                for (matchUser of team2) {
                    let discordUser = await interaction.guild.members.cache.find( user => user.id === matchUser.user_id);
                    discordUser.voice.setChannel(team2Channel);
                }

                await interaction.reply({ content: 'Players moved to split channels', ephemeral: true });
            }
        }

        // Default Handler
        if (subcommandGroup == null && subcommand == null) {
            console.log(interaction);
            interaction.reply({ content: "You found a route that shouldn't work! Here's a cookie! 🍪 ", ephemeral: true});
            return;
        }

		await interaction.reply('Pong!');
	},
};