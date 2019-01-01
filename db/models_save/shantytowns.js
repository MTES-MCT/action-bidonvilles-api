/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    const ShantyTowns = sequelize.define('shantytowns', {
        shantytown_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'exists',
        },
        latitude: {
            type: DataTypes.REAL,
            allowNull: false,
        },
        longitude: {
            type: DataTypes.REAL,
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address_details: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        built_at: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        population_total: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        population_couples: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        population_minors: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        access_to_electricity: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        access_to_water: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        trash_evactuation: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
        },
        fk_town_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'town_types',
                key: 'town_type_id',
            },
        },
        fk_field_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'field_types',
                key: 'field_type_id',
            },
        },
        fk_owner_type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'owner_types',
                key: 'owner_type_id',
            },
        },
        fk_city: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'cities',
                key: 'city_id',
            },
        },
    }, {
        tableName: 'shantytowns',
        timestamps: false,
    });

    return ShantyTowns;
};
