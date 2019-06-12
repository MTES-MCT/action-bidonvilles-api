const Temporal = require('sequelize-temporal');
const { Model } = require('sequelize');

class AbstractModel extends Model {
    async myValidate() {
        const errors = {};
        const keys = Object.keys(this.rawAttributes);
        for (let i = 0; i < keys.length; i += 1) {
            const attribute = this.rawAttributes[keys[i]];
            if (!attribute.myValidate) {
                // eslint-disable-next-line no-continue
                continue;
            }

            try {
                // eslint-disable-next-line no-await-in-loop
                await attribute.myValidate.apply(this);
            } catch (fieldErrors) {
                errors[keys[i]] = fieldErrors;
            }
        }

        return errors;
    }
}

class ValidationError extends Error {
    constructor(errors, ...args) {
        super(...args);
        this.errors = errors;
    }

    get errors() {
        return this.errors;
    }
}

function trim(str) {
    return (str && str.replace && str.replace(/^\s+|\s+$/g, '')) || '';
}

module.exports = (sequelize, DataTypes) => {
    class Shantytown extends AbstractModel {
        static fields() {
            return Object
                .keys(this.attributes)
                // remove foreign keys
                .filter(attributeName => this.attributes[attributeName].onDelete === undefined)
                // remove auto-generated fields
                .filter(attributeName => !this.attributes[attributeName]._autoGenerated);
        }

        static unserialize(data) {
            this.fields()
                .forEach((attributeName) => {
                    console.log(attributeName);
                });

            return new this(data);
        }

        get latitude() {
            if (!this.address || !this.address.localisation || !this.address.localisation.coordinates) {
                return null;
            }

            return this.address.localisation.coordinates[0];
        }

        get longitude() {
            if (!this.address || !this.address.localisation || !this.address.localisation.coordinates) {
                return null;
            }

            return this.address.localisation.coordinates[1];
        }
    }

    Shantytown.init(
        {
            id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
                field: 'shantytown_id',
            },

            address: {
                type: DataTypes.STRING,
                allowNull: false,
                async myValidate() {
                    if (!this.address) {
                        throw new ValidationError(['La localisation du site est obligatoire']);
                    }

                    if (trim(this.address) === '') {
                        throw new ValidationError(['L\'adresse du site ne peut être vide']);
                    }

                    return undefined;
                },
            },
            latitude: {
                type: DataTypes.DOUBLE(2, 15),
                allowNull: false,
            },
            longitude: {
                type: DataTypes.DOUBLE(2, 15),
                allowNull: false,
                async myValidate() {
                },
            },
            priority: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            builtAt: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                field: 'built_at',
                validate: {
                    isDate: {
                        args: [true],
                        msg: 'La valeur saisie n\'est pas reconnue comme une date',
                    },
                    notFuture(value) {
                        const d = new Date(value);
                        if (d.getTime() > Date.now()) {
                            throw new Error('La date d\'installation du site ne peut être future');
                        }
                    },
                },
            },
            declaredAt: {
                type: DataTypes.DATEONLY,
                allowNull: true,
                field: 'declared_at',
            },

            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'open',
            },
            closedAt: {
                type: DataTypes.DATE,
                allowNull: true,
                field: 'closed_at',
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
            electricityType: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'electricity_types',
                    key: 'electricity_type_id',
                },
                field: 'fk_electricity_type',
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
            ownerComplaint: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
                field: 'owner_complaint',
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
        },
        {
            sequelize,
            modelName: 'Shantytown',
            tableName: 'shantytowns',
        },
    );

    Shantytown.associate = (models) => {
        Shantytown.belongsTo(models.City, { foreignKey: 'fk_city' });
        Shantytown.belongsTo(models.FieldType, { foreignKey: 'fk_field_type' });
        Shantytown.belongsTo(models.OwnerType, { foreignKey: 'fk_owner_type' });
        Shantytown.belongsToMany(models.SocialOrigin, {
            through: models.ShantytownOrigin,
            as: 'socialOrigins',
            foreignKey: 'fk_shantytown',
            bla: 1,
        });
        Shantytown.belongsToMany(models.ClosingSolution, {
            through: models.ShantytownClosingSolution,
            as: 'closingSolutions',
            foreignKey: 'fk_shantytown',
        });
        Shantytown.belongsTo(models.User, { foreignKey: 'created_by' });
        Shantytown.belongsTo(models.User, { foreignKey: 'updated_by' });
    };

    return Temporal(Shantytown, sequelize);
};
