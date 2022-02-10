module.exports = (sequelize, DataTypes) => {
	return sequelize.define('guild', {
		guild_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		matching_lobby_id: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		matching_team1_id: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		matching_team2_id: {
			type: DataTypes.STRING,
			allowNull: true,
		}
	}, {
		timestamps: true,
	});
};