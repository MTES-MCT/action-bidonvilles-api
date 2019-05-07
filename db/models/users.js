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
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        company: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'roles',
                key: 'role_id',
            },
            field: 'fk_role',
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
        ngo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'ngos',
                key: 'ngo_id',
            },
            field: 'fk_ngo',
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
        User.belongsTo(models.Role, { foreignKey: 'fk_role' });
        User.belongsTo(models.Ngo, { foreignKey: 'fk_ngo' });
    };

    return User;
};
