const Temporal = require('sequelize-temporal');

module.exports = function (sequelize, DataTypes) {
    const Shantytown = sequelize.define('Shantytown', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'shantytown_id',
        },
        priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 4,
        },
        status: {
            type: DataTypes.ENUM('open', 'immediately_expelled', 'closed', 'closed_by_justice', 'closed_by_admin', 'covered'),
            allowNull: false,
            defaultValue: 'open',
        },
        closedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'closed_at',
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
        owner: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        builtAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'built_at',
        },
        declaredAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'declared_at',
        },
        censusStatus: {
            type: DataTypes.ENUM('none', 'scheduled', 'done'),
            allowNull: true,
            field: 'census_status',
        },
        censusConductedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'census_conducted_at',
        },
        censusConductedBy: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'census_conducted_by',
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
        justiceProcedure: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'justice_procedure',
        },
        justiceRendered: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'justice_rendered',
        },
        justiceRenderedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'justice_rendered_at',
        },
        justiceRenderedBy: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'justice_rendered_by',
        },
        justiceChallenged: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'justice_challenged',
        },
        policeStatus: {
            type: DataTypes.ENUM('none', 'requested', 'granted'),
            allowNull: true,
            field: 'police_status',
        },
        policeRequestedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'police_requested_at',
        },
        policeGrantedAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: 'police_granted_at',
        },
        bailiff: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'bailiff',
        },
        status: {
            type: DataTypes.ENUM('open', 'gone', 'covered', 'expelled'),
            allowNull: false,
            defaultValue: 'open',
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
        updatedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'user_id',
            },
            field: 'updated_by',
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
        Shantytown.belongsTo(models.User, { foreignKey: 'updated_by' });
    };

    return Temporal(Shantytown, sequelize);
};
