/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('field_types', {
        field_type_id: {
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
    }, {
        tableName: 'field_types',
        timestamps: false,
    });
};
