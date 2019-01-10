const Actions = require('../../db/models').Action;
const ActionTypes = require('../../db/models').ActionType;
const ActionSteps = require('../../db/models').ActionStep;
const Cities = require('../../db/models').City;
const { Epci } = require('../../db/models');
const Departements = require('../../db/models').Departement;
const Regions = require('../../db/models').Region;

function getTerritory(action) {
    const territories = ['City', 'Epci', 'Departement', 'Region'];
    for (let i = 0, len = territories.length; i < len; i += 1) {
        const type = territories[i];
        if (action[type] !== null) {
            return {
                type: type.toLowerCase(),
                territory: action[type],
            };
        }
    }

    return null;
}

function serializeActionStep(actionStep) {
    return {
        id: actionStep.id,
        date: new Date(actionStep.date).getTime() / 1000,
        description: actionStep.description,
    };
}

function serializeAction(action) {
    const territory = getTerritory(action);

    return {
        id: action.id,
        name: action.name,
        description: action.description,
        startedAt: new Date(action.startedAt).getTime() / 1000,
        endedAt: action.endedAt ? new Date(action.endedAt).getTime() / 1000 : null,
        type: {
            id: action.ActionType.id,
            label: action.ActionType.label,
        },
        territory: {
            type: territory.type,
            id: territory.territory.id,
            name: territory.territory.name,
        },
        steps: action.actionSteps.map(serializeActionStep),
        createdAt: new Date(action.createdAt).getTime() / 1000,
        updatedAt: new Date(action.updatedAt).getTime() / 1000,
    };
}

function addError(errors, field, error) {
    if (!Object.prototype.hasOwnProperty.call(errors, field)) {
        // eslint-disable-next-line no-param-reassign
        errors[field] = [];
    }

    errors[field].push(error);
}

function getIntOrNull(str) {
    const parsed = parseInt(str, 10);
    return !Number.isNaN(parsed) ? parsed : null;
}

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

function cleanParams(body) {
    const {
        type,
        name,
        description,
        started_at,
        ended_at,
        territory_type,
        territory_code,
    } = body;

    return {
        type: getIntOrNull(type),
        name: trim(name),
        description: trim(description),
        startedAt: started_at || null,
        endedAt: ended_at || null,
        territoryType: trim(territory_type),
        territoryCode: trim(territory_code),
    };
}

async function validateInput(body, mode = 'create') {
    const {
        type,
        name,
        startedAt,
        endedAt,
        territoryType,
        territoryCode,
    } = cleanParams(body);

    const fieldErrors = {};
    const error = addError.bind(this, fieldErrors);

    // type
    if (type === null) {
        error('type', 'Le type d\'action est obligatoire');
    }

    // name
    if (name === '' || name === null) {
        error('name', 'Le nom de l\'action est obligatoire');
    }

    // startedAt
    let startedAtTimestamp;
    if (startedAt === null) {
        error('started_at', 'La date de démarrage de l\'action est obligatoire.');
    } else {
        startedAtTimestamp = new Date(startedAt).getTime();

        if (Number.isNaN(startedAtTimestamp)) {
            error('started_at', 'La date fournie n\'est pas reconnue');
        }
    }

    // endedAt
    if (endedAt !== null) {
        const endedAtTimestamp = new Date(endedAt).getTime();

        if (Number.isNaN(endedAtTimestamp)) {
            error('ended_at', 'La date fournie n\'est pas reconnue');
        } else if (endedAtTimestamp <= startedAtTimestamp) {
            error('ended_at', 'La date de fin de l\'action ne peut être antérieure à la date de début');
        }
    }

    // territory
    if (mode === 'create') {
        if (['region', 'departement', 'epci', 'city'].indexOf(territoryType) === -1) {
            error('territory', 'Le type de territoire n\'est pas reconnu');
        }

        if (territoryCode === null) {
            error('territory', 'Le territoire d\'application de l\'action est obligatoire');
        }
    }

    return fieldErrors;
}

module.exports = {
    list(req, res) {
        try {
            return Actions
                .findAll({
                    include: [
                        ActionTypes,
                        Cities,
                        Epci,
                        Departements,
                        Regions,
                        { model: ActionSteps, as: 'actionSteps' },
                    ],
                })
                .then(actions => res.status(200).send(actions.map(serializeAction)))
                .catch(error => res.status(400).send(error));
        } catch (error) {
            return res.status(400).send(error);
        }
    },

    async find(req, res) {
        return Actions
            .findOne({
                include: [
                    ActionTypes,
                    Cities,
                    Epci,
                    Departements,
                    Regions,
                    { model: ActionSteps, as: 'actionSteps' },
                ],
                where: {
                    action_id: req.params.id,
                },
            })
            .then(action => res.status(200).send(serializeAction(action)))
            .catch(error => res.status(400).send(error));
    },

    async add(req, res) {
        // check errors
        let fieldErrors = {};
        try {
            fieldErrors = await validateInput(req.body);
        } catch (error) {
            return res.status(500).send({ error });
        }

        if (Object.keys(fieldErrors).length > 0) {
            return res.status(400).send({
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: fieldErrors,
                },
            });
        }

        // create the action
        const {
            type,
            name,
            description,
            startedAt,
            territoryType,
            territoryCode,
        } = cleanParams(req.body);

        try {
            const action = await Actions.create({
                type,
                name,
                description,
                startedAt,
                city: territoryType === 'city' ? territoryCode : null,
                epci: territoryType === 'epci' ? territoryCode : null,
                departement: territoryType === 'departement' ? territoryCode : null,
                region: territoryType === 'region' ? territoryCode : null,
                createdBy: req.decoded.userId,
            });

            return res.status(200).send(action);
        } catch (e) {
            return res.status(500).send({
                error: {
                    developer_message: e.message,
                    user_message: 'Une erreur est survenue dans l\'enregistrement de l\'action en base de données',
                },
            });
        }
    },

    async edit(req, res) {
        // check errors
        let fieldErrors = {};
        try {
            fieldErrors = await validateInput(req.body, 'edit');
        } catch (error) {
            return res.status(500).send({ error });
        }

        if (Object.keys(fieldErrors).length > 0) {
            return res.status(400).send({
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: fieldErrors,
                },
            });
        }

        // check if the action exists
        let action;
        try {
            action = await Actions.findOne({
                where: {
                    action_id: req.params.id,
                },
                include: [
                    ActionTypes,
                    Cities,
                    Epci,
                    Departements,
                    Regions,
                    { model: ActionSteps, as: 'actionSteps' },
                ],
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: error.message,
                    user_message: 'Une erreur est survenue dans la recherche de l\'action en base de données',
                },
            });
        }

        if (action === null) {
            return res.status(404).send({
                error: {
                    developer_message: `Tried to update unknown action of id #${req.params.id}`,
                    user_message: `L'action d'identifiant ${req.params.id} n'existe pas : mise à jour impossible`,
                },
            });
        }

        // update the action
        const {
            type,
            startedAt,
            endedAt,
            name,
            description,
        } = cleanParams(req.body);

        try {
            await action.update({
                type,
                startedAt,
                endedAt,
                name,
                description,
                updatedBy: req.decoded.userId,
            });

            return res.status(200).send(serializeAction(action));
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: error.message,
                    user_message: 'Une erreur est survenue dans l\'enregistrement des modifications en base de données',
                },
            });
        }
    },

    async addStep(req, res) {
        const {
            description,
        } = cleanParams(req.body);

        // get the related action
        let action;
        try {
            action = await Actions.findOne({
                where: {
                    action_id: req.params.id,
                },
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to retrieve the action',
                    user_message: 'Impossible de retrouver l\'action concernée en base de données',
                },
            });
        }

        if (action === null) {
            return res.status(404).send({
                error: {
                    developer_message: 'Action does not exist',
                    user_message: 'L\'action à laquelle rajouter une étape n\'existe pas',
                },
            });
        }

        // ensure the description is not empty
        const trimmedDescription = trim(description);
        if (trimmedDescription === null || trimmedDescription.length === 0) {
            return res.status(404).send({
                error: {
                    developer_message: 'The submitted data contains errors',
                    user_message: 'Certaines données sont invalides',
                    fields: {
                        description: ['La description est obligatoire'],
                    },
                },
            });
        }

        // add the step
        try {
            await ActionSteps.create({
                action_step_id: Math.round(Date.now() / 1000),
                action: action.id,
                date: new Date(),
                description: trimmedDescription,
            });

            const steps = await ActionSteps.findAll({
                where: {
                    action: action.id,
                },
            });
            return res.status(200).send({
                steps: steps.map(serializeActionStep),
            });
        } catch (e) {
            return res.status(500).send({
                error: {
                    developer_message: e.message,
                    user_message: 'Une erreur est survenue dans l\'enregistrement de l\'étape en base de données',
                },
            });
        }
    },
};
