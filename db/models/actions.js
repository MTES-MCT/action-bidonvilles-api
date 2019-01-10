const Temporal = require('sequelize-temporal');

module.exports = function (sequelize, DataTypes) {
    const Action = sequelize.define('Action', {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
            field: 'action_id',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'started_at',
        },
        endedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'ended_at',
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'action_types',
                key: 'action_type_id',
            },
            field: 'fk_action_type',
        },
        city: {
            type: DataTypes.STRING(5),
            allowNull: true,
            references: {
                model: 'cities',
                key: 'city_id',
            },
            field: 'fk_city',
        },
        epci: {
            type: DataTypes.STRING(9),
            allowNull: true,
            references: {
                model: 'epci',
                key: 'epci_id',
            },
            field: 'fk_epci',
        },
        departement: {
            type: DataTypes.STRING(3),
            allowNull: true,
            references: {
                model: 'departements',
                key: 'departement_id',
            },
            field: 'fk_departement',
        },
        region: {
            type: DataTypes.STRING(2),
            allowNull: true,
            references: {
                model: 'regions',
                key: 'region_id',
            },
            field: 'fk_region',
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
        tableName: 'actions',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    Action.associate = (models) => {
        Action.belongsTo(models.ActionType, { foreignKey: 'fk_action_type' });
        Action.belongsTo(models.City, { foreignKey: 'fk_city' });
        Action.belongsTo(models.Epci, { foreignKey: 'fk_epci' });
        Action.belongsTo(models.Departement, { foreignKey: 'fk_departement' });
        Action.belongsTo(models.Region, { foreignKey: 'fk_region' });
        Action.belongsTo(models.User, { foreignKey: 'created_by' });
        Action.belongsTo(models.User, { foreignKey: 'updated_by' });
        Action.belongsToMany(models.ActionStep, {
            through: models.ActionStep,
            as: 'actionSteps',
            foreignKey: 'fk_action',
        });
    };

    return Temporal(Action, sequelize);
};
