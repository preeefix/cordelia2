module.exports = (sequelize, DataTypes) => {
	return sequelize.define('matches', {
		match_id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		initiator_id: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		team1: {
			type: DataTypes.STRING(1000),
			allowNull: false,
		},
		team2: {
			type: DataTypes.STRING(1000),
			allowNull: false,
		},
		team1score: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
		team2score: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
		winner: {
			type: DataTypes.STRING(10),
			allowNull: true,
		},
	}, {
		timestamps: true,
	});
};