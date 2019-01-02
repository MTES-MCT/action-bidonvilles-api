module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'user_id',
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        departement: {
            type: DataTypes.STRING(3),
            allowNull: false,
            references: {
                model: 'departements',
                key: 'code',
            },
            field: 'fk_departement',
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
        tableName: 'users',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    User.associate = (models) => {
        User.belongsTo(models.Departement, { foreignKey: 'fk_departement' });
    };

    return User;
};
