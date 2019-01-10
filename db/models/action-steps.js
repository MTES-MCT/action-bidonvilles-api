const Temporal = require('sequelize-temporal');

module.exports = function (sequelize, DataTypes) {
    const ActionStep = sequelize.define('ActionStep', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'action_step_id',
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        action: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'actions',
                key: 'action_id',
            },
            field: 'fk_action',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
            field: 'updated_at',
        },
    }, {
        tableName: 'action_steps',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    ActionStep.associate = (models) => {
        ActionStep.belongsTo(models.Action, { foreignKey: 'fk_action' });
    };

    return Temporal(ActionStep, sequelize);
};
