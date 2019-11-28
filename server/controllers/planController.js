const { trim } = require('validator');
const { sequelize } = require('#db/models');

function sanitize(data) {
    const sanitizedData = {};

    // name
    if (typeof data.name === 'string') {
        sanitizedData.name = trim(data.name);
    }

    // started at
    const startedAt = new Date(data.startedAt);
    if (!Number.isNaN(startedAt.getTime())) {
        sanitizedData.startedAt = startedAt;
    }

    // expected to end at
    if (data.expectedToEndAt === undefined || data.expectedToEndAt === null) {
        sanitizedData.expectedToEndAt = null;
    } else {
        const expectedToEndAt = new Date(data.expectedToEndAt);
        if (!Number.isNaN(expectedToEndAt.getTime())) {
            sanitizedData.expectedToEndAt = expectedToEndAt;
        }
    }

    // in and out
    if (data.in_and_out === 1) {
        sanitizedData.inAndOut = true;
    } else if (data.in_and_out === 0) {
        sanitizedData.inAndOut = false;
    }

    // topics
    if (Array.isArray(data.topics)) {
        sanitizedData.topics = data.topics;
    }

    // goals
    if (typeof data.goals === 'string') {
        sanitizedData.goals = trim(data.goals);
    }

    // location
    if (typeof data.locationType === 'string') {
        sanitizedData.locationType = data.locationType;
    }

    switch (data.locationType) {
        case 'shantytowns':
            if (Array.isArray(data.locationShantytowns)) {
                sanitizedData.locationShantytowns = data.locationShantytowns;
            } else {
                sanitizedData.locationShantytowns = [];
            }
            break;

        case 'location':
            if (data.locationAddress && data.locationAddress.address && data.locationAddress.location) {
                sanitizedData.locationAddress = {
                    latitude: data.locationAddress.location.coordinates[0],
                    longitude: data.locationAddress.location.coordinates[1],
                    address: data.locationAddress.address.label,
                };
            } else {
                sanitizedData.locationAddress = null;
            }
            break;

        case 'other':
            if (typeof data.locationDetails === 'string') {
                sanitizedData.locationDetails = trim(data.locationDetails);
            }
            break;

        default:
        case 'housing':
            break;
    }

    if (!sanitizedData.locationDetails) {
        sanitizedData.locationDetails = null;
    }

    // government contact
    if (Array.isArray(data.government)) {
        if (data.government.length === 0) {
            sanitizedData.government = null;
        } else {
            [sanitizedData.government] = data.government;
        }
    }

    // association contact
    if (Array.isArray(data.association)) {
        if (data.association.length === 0) {
            sanitizedData.association = null;
        } else {
            [sanitizedData.association] = data.association;
        }
    }

    if (data.contact === undefined || data.contact === null) {
        sanitizedData.associationContact = null;
    } else {
        sanitizedData.associationContact = parseInt(data.contact, 10);
    }

    // fundings
    if (Array.isArray(data.finances)) {
        sanitizedData.finances = data.finances
            .filter(({ data: d }) => d && d.length > 0)
            .map(({ year, data: d }) => ({
                year: parseInt(year, 10),
                data: d.map(({ type, amount, details }) => ({
                    type: type !== null ? type : null,
                    amount: parseFloat(amount),
                    details: trim(details),
                })),
            }));
    }

    return sanitizedData;
}

function sanitizeState(data) {
    const sanitizedData = {};

    // date
    const date = new Date(data.date);
    if (!Number.isNaN(date.getTime())) {
        sanitizedData.date = date;
    }

    return data;
}

module.exports = models => ({
    async list(req, res) {
        try {
            const plans = await models.plan.findAll(req.user);
            res.status(200).send(plans);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },

    async find(req, res) {
        try {
            const plans = await models.plan.findOne(req.user, req.params.id);
            res.status(200).send(plans);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },

    async create(req, res) {
        // sanitize data
        const planData = Object.assign({}, sanitize(req.body), {
            createdBy: req.user.id,
        });

        // validate data
        const errors = {};
        function addError(field, error) {
            if (errors[field] === undefined) {
                errors[field] = [];
            }

            errors[field].push(error);
        }

        let financeTypes;
        try {
            financeTypes = (await models.financeType.findAll()).reduce((acc, type) => Object.assign({}, acc, {
                [type.uid]: type,
            }), {});
        } catch (error) {
            return res.status(500).send({
                success: false,
                error: {
                    developer_message: 'Could not fetch the list of finance types from the database',
                    user_message: 'Une erreur de lecture en base de données est survenue',
                },
            });
        }

        let topics;
        try {
            topics = (await models.topic.findAll()).reduce((acc, topic) => Object.assign({}, acc, {
                [topic.uid]: topic,
            }), {});
        } catch (error) {
            return res.status(500).send({
                success: false,
                error: {
                    developer_message: 'Could not fetch the list of topics from the database',
                    user_message: 'Une erreur de lecture en base de données est survenue',
                },
            });
        }

        if (!planData.name) {
            addError('name', 'Le nom du dispositif est obligatoire');
        }

        if (!planData.startedAt) {
            addError('startedAt', 'La date de début du dispositif est obligatoire');
        }

        if (planData.expectedToEndAt && planData.expectedToEndAt <= planData.startedAt) {
            addError('expectedToEndAt', 'La date de fin du dispositif ne peut pas être antérieure à la date de début');
        }

        if (typeof planData.inAndOut !== 'boolean') {
            addError('in_and_out', 'Ce champ est obligatoire');
        }

        if (planData.topics.length === 0) {
            addError('topics', 'Vous devez sélectionner au moins une thématique');
        } else {
            const unknownTopics = planData.topics.filter(uid => topics[uid] === undefined);
            if (unknownTopics.length > 0) {
                addError('topics', `Les thématiques suivantes n'ont pas été reconnues : ${unknownTopics.join(', ')}`);
            }
        }

        if (!planData.goals) {
            addError('goals', 'Les objectifs sont obligatoires');
        }

        if (!planData.locationType) {
            addError('locationType', 'Le lieu est obligatoire');
        } else if (['shantytowns', 'location', 'housing', 'other'].indexOf(planData.locationType) === -1) {
            addError('locationType', 'Le type de lieu sélectionné n\'est pas reconnu');
        }

        switch (planData.locationType) {
            case 'shantytowns':
                if (planData.locationShantytowns.length === 0) {
                    addError('locationShantytowns', 'Vous devez sélectionner au moins un site');
                } else {
                    try {
                        const ids = await models.shantytown.findAll(req.user, [
                            {
                                shantytown_id: planData.locationShantytowns.map(({ id }) => id),
                            },
                        ]);

                        if (ids.length !== planData.locationShantytowns.length) {
                            addError('locationShantytowns', 'Un ou plusieurs sites sélectionnés n\'ont pas été retrouvés en base de données');
                        }
                    } catch (error) {
                        addError('locationShantytowns', 'Une erreur est survenue lors de la validation des sites');
                    }
                }
                break;

            case 'location':
                if (!planData.locationAddress) {
                    addError('locationAddress', 'L\'adresse du terrain est obligatoire');
                }
                break;

            case 'other':
                if (!planData.locationDetails) {
                    addError('locationDetails', 'Vous devez préciser les lieux de déroulement du dispositif');
                }
                break;

            default:
        }

        if (!planData.government) {
            addError('government', 'Vous devez désigner la personne en charge du pilotage du dispositif');
        } else {
            try {
                const user = await models.user.findOne(planData.government.id);
                if (user === null) {
                    addError('government', 'La personne désignée comme pilote du dispositif n\'a pas été retrouvée en base de données');
                } else if (user.organization.category.uid !== 'public_establishment') {
                    addError('government', 'Le pilote du dispositif doit faire partie d\'un service de l\'état');
                }
            } catch (error) {
                addError('government', 'Une erreur est survenue lors de la validation du pilote du dispositif');
            }
        }

        if (!planData.associationContact) {
            addError('association', 'Vous devez désigner la personne référente au sein de l\'opérateur ou service en charge de l\'intervention');
        } else {
            try {
                const user = await models.user.findOne(planData.associationContact);
                if (user === null) {
                    addError('contact', 'La personne référente n\'a pas été retrouvée en base de données');
                } else if (user.organization.category.uid !== 'association') {
                    addError('association', 'Le service en charge de l\'intervention doit être une association');
                }
            } catch (error) {
                addError('contact', 'Une erreur est survenue lors de la validation du service en charge de l\'intervention');
            }
        }

        if (planData.finances) {
            planData.finances.forEach(({ year, data }) => {
                if (year > (new Date()).getFullYear()) {
                    addError('finances', `Il est impossible de saisir les financements pour l'année ${year}`);
                } else {
                    data.forEach(({ amount, type }, index) => {
                        const typeName = financeTypes[type] ? `'${financeTypes[type].name}'` : `de la ligne n°${index + 1}`;

                        if (!type) {
                            addError('finances', `Année ${year} : merci de préciser le type de financement pour la ligne n°${index + 1}`);
                        } else if (financeTypes[type] === undefined) {
                            addError('finances', `Année ${year} : le type de financement de la ligne n°${index + 1} n'est pas reconnu`);
                        }

                        if (Number.isNaN(amount)) {
                            addError('finances', `Année ${year} : le montant du financement ${typeName} est invalide`);
                        } else if (amount <= 0) {
                            addError('finances', `Année ${year} : le montant du financement ${typeName} ne peut pas être négatif ou nul`);
                        }
                    });
                }
            });
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).send({
                success: false,
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: errors,
                },
            });
        }

        // insert into database
        let finalPlanId;
        try {
            [finalPlanId] = await sequelize.transaction(async (t) => {
                let locationId = null;
                if (planData.locationType === 'location') {
                    const response = await sequelize.query(
                        `INSERT INTO locations(
                            address,
                            latitude,
                            longitude,
                            created_by
                        ) VALUES(
                            :address,
                            :latitude,
                            :longitude,
                            :createdBy
                        ) RETURNING location_id AS id`,
                        {
                            replacements: Object.assign({}, planData.locationAddress, {
                                createdBy: req.user.id,
                            }),
                            transaction: t,
                        },
                    );

                    locationId = response[0][0].id;
                }

                const response = await sequelize.query(
                    `INSERT INTO plans2(
                        name,
                        started_at,
                        expected_to_end_at,
                        in_and_out,
                        goals,
                        fk_category,
                        location_type,
                        location_details,
                        fk_location,
                        created_by
                    ) VALUES(
                        :name,
                        :startedAt,
                        :expectedToEndAt,
                        :inAndOut,
                        :goals,
                        'autre',
                        :locationType,
                        :locationDetails,
                        :fk_location,
                        :createdBy
                    ) RETURNING plan_id AS id`,
                    {
                        replacements: Object.assign({}, planData, {
                            fk_location: locationId,
                        }),
                        transaction: t,
                    },
                );
                const planId = response[0][0].id;

                await sequelize.query(
                    `INSERT INTO plan_topics(fk_plan, fk_topic, created_by)
                    VALUES ${planData.topics.map(() => '(?, ?, ?)').join(', ')}`,
                    {
                        replacements: planData.topics.reduce((acc, uid) => [
                            ...acc,
                            planId,
                            uid,
                            req.user.id,
                        ], []),
                        transaction: t,
                    },
                );

                if (planData.locationType === 'shantytowns') {
                    await sequelize.query(
                        `INSERT INTO plan_shantytowns(fk_plan, fk_shantytown, created_by)
                        VALUES ${planData.locationShantytowns.map(() => '(?, ?, ?)').join(', ')}`,
                        {
                            replacements: planData.locationShantytowns.reduce((acc, { id }) => [
                                ...acc,
                                planId,
                                id,
                                req.user.id,
                            ], []),
                            transaction: t,
                        },
                    );
                }

                // insert into finances
                const financeIds = await Promise.all(
                    planData.finances.map(({ year }) => sequelize.query(
                        'INSERT INTO finances(fk_plan, year, created_by) VALUES (:planId, :year, :createdBy) RETURNING finance_id AS id',
                        {
                            replacements: {
                                planId,
                                year,
                                createdBy: req.user.id,
                            },
                            transaction: t,
                        },
                    )),
                );

                // insert into finance_rows
                await Promise.all(
                    planData.finances.reduce((acc, { data }, index) => [
                        ...acc,
                        ...data.map(({ amount, type, details }) => sequelize.query(
                            `INSERT INTO finance_rows(fk_finance, fk_finance_type, amount, comments, created_by)
                            VALUES (:financeId, :type, :amount, :comments, :createdBy)`,
                            {
                                replacements: {
                                    financeId: financeIds[index][0][0].id,
                                    type,
                                    amount,
                                    comments: details,
                                    createdBy: req.user.id,
                                },
                                transaction: t,
                            },
                        )),
                    ], []),
                );

                return Promise.all([
                    Promise.resolve(planId),
                    sequelize.query(
                        `INSERT INTO plan_managers(fk_plan, fk_user, created_by)
                        VALUES (:planId, :userId, :createdBy)`,
                        {
                            replacements: {
                                planId,
                                userId: planData.government.id,
                                createdBy: req.user.id,
                            },
                            transaction: t,
                        },
                    ),

                    sequelize.query(
                        `INSERT INTO plan_operators(fk_plan, fk_user, created_by)
                        VALUES (:planId, :userId, :createdBy)`,
                        {
                            replacements: {
                                planId,
                                userId: planData.associationContact,
                                createdBy: req.user.id,
                            },
                            transaction: t,
                        },
                    ),
                ]);
            });
        } catch (error) {
            return res.status(500).send({
                success: false,
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                    developer_message: error,
                },
            });
        }

        return res.status(200).send({
            id: finalPlanId,
        });
    },

    async addState(req, res) {
        // sanitize data
        const stateData = Object.assign({}, sanitizeState(req.body), {
            createdBy: req.user.id,
        });

        // validate data
        const errors = {};
        function addError(field, error) {
            if (errors[field] === undefined) {
                errors[field] = [];
            }

            errors[field].push(error);
        }

        if (!stateData.date) {
            addError('date', 'La date est obligatoire');
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).send({
                success: false,
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: errors,
                },
            });
        }

        // insert into database
        return res.status(500).send({
            success: false,
            error: {
                user_message: 'Une erreur inconnue est survenue',
            },
        });
    },

    async link(req, res) {
        try {
            await models.plan.addTown(req.params.id, req.body.townId, req.user.id);
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                },
            });
        }

        return res.status(200).send({});
    },

    async updateDetails(req, res) {
        try {
            await models.plan.updateDetails(req.params.id, req.body);
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                    developer_message: error,
                },
            });
        }

        return res.status(200).send({});
    },

    async delete(req, res) {
        try {
            await models.plan.delete(req.params.id);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                    developer_message: error,
                },
            });
        }

        return res.status(200).send({});
    },

});
