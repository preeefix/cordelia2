module.exports = (sequelize, DataTypes) => {
	return sequelize.define('rankings', {
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		guild_id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		mu: {
			type: DataTypes.FLOAT,
			defaultValue: 25,
			allowNull: false,
		},
        sigma: {
            type: DataTypes.FLOAT,
            defaultValue: 25/3, // 8.3333333
            allowNull: false,
        },
		ordinal: {
			type: DataTypes.FLOAT,
			defaultValue: 0,
			allowNull: false,
		}
	}, {
		timestamps: true,
	});
};