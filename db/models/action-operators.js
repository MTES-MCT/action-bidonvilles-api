module.exports = function (sequelize, DataTypes) {
    const ActionOperator = sequelize.define('ActionOperator', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'action_operator_id',
        },
        fk_action: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'action',
                key: 'action_id',
            },
        },
        fk_operator: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'operators',
                key: 'operator_id',
            },
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
        tableName: 'action_operators',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    return ActionOperator;
};
