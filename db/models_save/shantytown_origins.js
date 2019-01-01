/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('shantytown_origins', {
        town_origins_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        fk_shantytown_id: {
            type: DataTypes.INTEGER,
            unique: 'uk_town_origin',
            allowNull: false,
            references: {
                model: 'shantytowns',
                key: 'shantytown_id',
            },
        },
        fk_social_origins_id: {
            type: DataTypes.INTEGER,
            unique: 'uk_town_origin',
            allowNull: false,
            references: {
                model: 'social_origins',
                key: 'social_origin_id',
            },
        },
    }, {
        tableName: 'shantytown_origins',
        timestamps: false,
    });
};
