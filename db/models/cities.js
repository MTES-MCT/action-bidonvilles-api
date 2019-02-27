module.exports = function (sequelize, DataTypes) {
    const City = sequelize.define('City', {
        code: {
            type: DataTypes.STRING(5),
            allowNull: false,
            primaryKey: true,
        },
        name: {
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
        tableName: 'cities',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    City.associate = (models) => {
        City.belongsTo(models.Departement, { foreignKey: 'fk_departement' });
    };

    return City;
};
