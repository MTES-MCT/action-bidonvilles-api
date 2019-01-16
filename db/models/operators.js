module.exports = function (sequelize, DataTypes) {
    const Operator = sequelize.define('Operator', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'operator_id',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
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
        tableName: 'operators',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    Operator.associate = function (models) {
        Operator.belongsToMany(models.Action, {
            through: models.ActionOperator,
            foreignKey: 'fk_operator',
        });
    };

    return Operator;
};
