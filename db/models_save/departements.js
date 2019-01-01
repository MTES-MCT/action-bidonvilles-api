/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('departements', {
        departement_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        latitude: {
            type: DataTypes.REAL,
            allowNull: false,
        },
        longitude: {
            type: DataTypes.REAL,
            allowNull: false,
        },
        fk_region: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'regions',
                key: 'region_id',
            },
        },
    }, {
        tableName: 'departements',
        timestamps: false,
    });
};
