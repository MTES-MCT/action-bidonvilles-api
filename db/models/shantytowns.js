module.exports = function (sequelize, DataTypes) {
    const Shantytown = sequelize.define('Shantytown', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'shantytown_id',
        },
        latitude: {
            type: DataTypes.DOUBLE(2, 15),
            allowNull: false,
        },
        longitude: {
            type: DataTypes.DOUBLE(2, 15),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        addressDetails: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'address_details',
        },
        city: {
            type: DataTypes.STRING(5),
            allowNull: false,
            references: {
                model: 'cities',
                key: 'city_id',
            },
            field: 'fk_city',
        },
        builtAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'built_at',
        },
        fieldType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'field_types',
                key: 'field_type_id',
            },
            field: 'fk_field_type',
        },
        ownerType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'owner_types',
                key: 'owner_type_id',
            },
            field: 'fk_owner_type',
        },
        populationTotal: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'population_total',
        },
        populationCouples: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'population_couples',
        },
        populationMinors: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
            field: 'population_minors',
        },
        accessToElectricity: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'access_to_electricity',
        },
        accessToWater: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'access_to_water',
        },
        trashEvacuation: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'trash_evacuation',
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
            field: 'created_by',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
            field: 'updated_at',
        },
    }, {
        tableName: 'shantytowns',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    Shantytown.associate = (models) => {
        Shantytown.belongsTo(models.City, { foreignKey: 'fk_city' });
        Shantytown.belongsTo(models.FieldType, { foreignKey: 'fk_field_type' });
        Shantytown.belongsTo(models.OwnerType, { foreignKey: 'fk_owner_type' });
        Shantytown.belongsToMany(models.SocialOrigin, {
            through: models.ShantytownOrigin,
            as: 'socialOrigins',
            foreignKey: 'fk_shantytown',
        });
        Shantytown.belongsTo(models.User, { foreignKey: 'created_by' });
    };

    return Shantytown;
};
