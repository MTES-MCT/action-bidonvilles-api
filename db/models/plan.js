const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Plan extends Model {}

    let models;
    Plan.associate = (argModels) => {
        models = argModels;
    };

    Plan.init(
        {
            plan_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    not: {
                        args: [/^\s+$/i],
                        msg: 'Le nom du dispositif doit contenir au moins un caractère alphabétique',
                    },
                },
            },
            startedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                allowNullMsg: 'La date de début du dispositif est obligatoire',
                validate: {
                    isDate: {
                        msg: 'La date de début du dispositif est invalide',
                    },
                },
                field: 'started_at',
            },
            ended_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            ngo: {
                type: DataTypes.INTEGER,
                allowNull: false,
                allowNullMsg: 'L\'opérateur en charge du dispositif est obligatoire',
                validate: {
                    async ngoExists() {
                        const ngo = await models.Ngo.findOne({
                            where: {
                                id: parseInt(this.ngo, 10),
                            },
                        });

                        if (ngo === null) {
                            throw new Error('L\'opérateur sélectionné n\'existe pas');
                        }
                    },
                },
                field: 'fk_ngo',
            },
            type: {
                type: DataTypes.INTEGER,
                allowNull: false,
                allowNullMsg: 'Le type de dispositif est obligatoire',
                validate: {
                    async typeExists() {
                        const planType = await models.PlanType.findOne({
                            where: {
                                id: parseInt(this.type, 10),
                            },
                        });

                        if (planType === null) {
                            throw new Error('Ce type de dispositif n\'existe pas');
                        }
                    },
                },
                field: 'fk_type',
            },
            targetedOnTowns: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                allowNullMsg: 'Préciser si l\'action est menée sur un site en particulier est obligatoire',
                field: 'targeted_on_towns',
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                onUpdate: DataTypes.NOW,
            },
            updated_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Plan',
            tableName: 'plans',
        },
    );

    return Plan;
};
