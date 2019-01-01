/* jshint indent: 2 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('action_steps', {
        action_step_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        fk_action: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'actions',
                key: 'action_id',
            },
        },
    }, {
        tableName: 'action_steps',
        timestamps: false,
    });
};
