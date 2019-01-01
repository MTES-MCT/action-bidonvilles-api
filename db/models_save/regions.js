/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('regions', {
        region_id: {
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
    }, {
        tableName: 'regions',
        timestamps: false,
    });
};
