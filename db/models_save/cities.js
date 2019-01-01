/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('City', {
        city_code: {
            type: Sequelize.STRING(5),
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    }, {
        tableName: 'cities',
    });
};
