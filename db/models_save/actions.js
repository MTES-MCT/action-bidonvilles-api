/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('actions', {
        action_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        started_at: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        ended_at: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        operator: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        fk_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'action_types',
                key: 'action_type_id',
            },
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'actions',
        timestamps: false,
    });
};
