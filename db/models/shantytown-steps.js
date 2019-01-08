module.exports = function (sequelize, DataTypes) {
    const ShantytownStep = sequelize.define('ShantytownStep', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'shantytown_step_id',
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        shantytown: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'shantytowns',
                key: 'shantytown_id',
            },
            field: 'fk_shantytown',
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
        tableName: 'shantytown_steps',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    ShantytownStep.associate = (models) => {
        ShantytownStep.belongsTo(models.Shantytown, { foreignKey: 'fk_shantytown' });
        ShantytownStep.belongsTo(models.Action, { foreignKey: 'fk_action' });
    };

    return ShantytownStep;
};
