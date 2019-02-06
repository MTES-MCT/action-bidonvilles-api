const { sequelize } = require('../../db/models');
const Cities = require('../../db/models').City;
const ShantyTowns = require('../../db/models').Shantytown;
const ShantyTownComments = require('../../db/models').ShantytownComment;

function addError(errors, field, error) {
    if (!Object.prototype.hasOwnProperty.call(errors, field)) {
        // eslint-disable-next-line no-param-reassign
        errors[field] = [];
    }

    errors[field].push(error);
}

function getFloatOrNull(str) {
    const parsed = parseFloat(str);
    return !Number.isNaN(parsed) ? parsed : null;
}

function getIntOrNull(str) {
    const parsed = parseInt(str, 10);
    return !Number.isNaN(parsed) ? parsed : null;
}

function toBool(int) {
    if (int === 1) {
        return true;
    }

    if (int === 0) {
        return false;
    }

    return null;
}

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

function cleanParams(body) {
    const {
        priority,
        built_at,
        status,
        closed_at,
        latitude,
        longitude,
        city,
        citycode,
        address,
        detailed_address,
        population_total,
        population_couples,
        population_minors,
        access_to_electricity,
        access_to_water,
        trash_evacuation,
        justice_status,
        justice_rendered_by,
        justice_rendered_at,
        social_origins,
        field_type,
        owner_type,
        owner,
        declared_at,
        census_status,
        census_requested_at,
        census_conducted_at,
        census_conducted_by,
        police_status,
        police_requested_at,
        police_granted_at,
        bailiff,
    } = body;

    return {
        priority: getIntOrNull(priority),
        builtAt: built_at !== '' ? built_at : null,
        status: trim(status),
        closedAt: closed_at,
        latitude: getFloatOrNull(latitude),
        longitude: getFloatOrNull(longitude),
        city: trim(city),
        citycode: trim(citycode),
        address: trim(address),
        addressDetails: trim(detailed_address),
        populationTotal: getIntOrNull(population_total),
        populationCouples: getIntOrNull(population_couples),
        populationMinors: getIntOrNull(population_minors),
        accessToElectricity: getIntOrNull(access_to_electricity),
        accessToWater: getIntOrNull(access_to_water),
        trashEvacuation: getIntOrNull(trash_evacuation),
        justiceStatus: trim(justice_status),
        justiceRenderedBy: trim(justice_rendered_by),
        justiceRenderedAt: justice_rendered_at,
        socialOrigins: social_origins,
        fieldType: getIntOrNull(field_type),
        ownerType: getIntOrNull(owner_type),
        owner: trim(owner),
        declaredAt: declared_at,
        censusStatus: trim(census_status),
        censusRequestedAt: census_requested_at,
        censusConductedAt: census_conducted_at,
        censusConductedBy: trim(census_conducted_by),
        policeStatus: trim(police_status),
        policeRequestedAt: police_requested_at,
        policeGrantedAt: police_granted_at,
        bailiff: trim(bailiff),
    };
}

async function validateInput(body, mode = 'create') {
    const {
        priority,
        builtAt,
        status,
        closedAt,
        address,
        city,
        citycode,
        latitude,
        longitude,
        populationTotal,
        populationCouples,
        populationMinors,
        accessToElectricity,
        accessToWater,
        trashEvacuation,
        justiceStatus,
        justiceRenderedAt,
        fieldType,
        ownerType,
        declaredAt,
    } = cleanParams(body);

    const now = Date.now();
    const fieldErrors = {};
    const error = addError.bind(this, fieldErrors);

    // priority
    if (priority === null) {
        error('priority', 'La niveau de priorité du site est obligatoire');
    } else if (priority < 1 || priority > 4) {
        error('priority', 'Le niveau de priorité doit être compris entre 1 et 4');
    }

    // builtAt
    let builtAtTimestamp = null;
    if (builtAt === '') {
        error('built_at', 'La date d\'installation est obligatoire.');
    } else {
        builtAtTimestamp = new Date(builtAt).getTime();

        if (Number.isNaN(builtAtTimestamp)) {
            error('built_at', 'La date fournie n\'est pas reconnue');
        } else if (builtAtTimestamp >= now) {
            error('built_at', 'La date d\'installation ne peut pas être future');
        }
    }

    // declaredAt
    let declaredAtTimestamp = null;
    if (declaredAt === '') {
        error('declared_at', 'La date de signalement est obligatoire.');
    } else {
        declaredAtTimestamp = new Date(declaredAt).getTime();

        if (Number.isNaN(declaredAtTimestamp)) {
            error('declared_at', 'La date fournie n\'est pas reconnue');
        } else if (declaredAtTimestamp >= now) {
            error('declared_at', 'La date de signalement ne peut pas être future');
        }
    }

    // status
    if (mode === 'edit') {
        if (status === null) {
            error('status', 'La cause de fermeture du site est obligatoire');
        } else if (['immediately_expelled', 'closed', 'closed_by_justice', 'closed_by_admin', 'covered'].indexOf(status) === -1) {
            error('status', 'La cause de fermeture du site fournie n\'est pas reconnue');
        }

        if (status !== 'open') {
            const timestamp = new Date(closedAt).getTime();

            if (Number.isNaN(timestamp)) {
                error('closed_at', 'La date fournie n\'est pas reconnue');
            } else {
                if (timestamp >= now) {
                    error('closed_at', 'La date de fermeture du site ne peut pas être future');
                }

                if (!Number.isNaN(builtAtTimestamp) && timestamp <= builtAtTimestamp) {
                    error('closed_at', 'La date de fermeture du site ne peut être antérieur à celle d\'installation');
                }
            }
        }
    }

    // address
    let dbCity = null;

    if (address === null || address.length === 0) {
        error('address', 'L\'adresse du site est obligatoire');
    } else if (city === null || citycode === null) {
        error('address', 'Impossible d\'associer une commune à l\'adresse indiquée');
    } else if (/^[0-9]{5}$/g.test(citycode) !== true) {
        error('address', 'Le code communal associé à l\'adresse est invalide');
    } else {
        try {
            dbCity = await Cities.findOne({
                where: {
                    code: citycode,
                },
            });
        } catch (e) {
            throw new Error({
                developer_message: e.message,
                user_message: 'Une erreur est survenue dans l\'identification de la commune en base de données',
            });
        }

        if (dbCity === null) {
            error('address', `La commune ${citycode} n'existe pas en base de données`);
        }
    }

    // latitude, longitude
    if (latitude === null || longitude === null) {
        error('address', 'Les coordonnées géographiques du site sont obligatoires');
    } else {
        if (latitude < -90 || latitude > 90) {
            error('address', 'La latitude est invalide');
        }

        if (longitude < -180 || longitude > 180) {
            error('address', 'La longitude est invalide');
        }
    }

    // field type
    if (fieldType === null) {
        error('field_type', 'Le champ "type de site" est obligatoire');
    }

    // owner type
    if (ownerType === null) {
        error('owner_type', 'Le champ "type de propriétaire" est obligatoire');
    }

    // justice status
    if (justiceStatus === null) {
        error('justice_status', 'Le champ "Statut judiciaire en cours" est obligatoire');
    } else if (['none', 'seized', 'rendered'].indexOf(justiceStatus) === -1) {
        error('justice_status', 'Valeur invalide');
    }

    // justice rendered at
    if (justiceRenderedAt !== '') {
        const justiceRenderedAtTimestamp = new Date(justiceRenderedAt).getTime();

        if (Number.isNaN(justiceRenderedAtTimestamp)) {
            error('justice_rendered_at', 'La date fournie n\'est pas reconnue');
        } else if (justiceRenderedAtTimestamp >= now) {
            error('justice_rendered_at', 'La date ne peut pas être future');
        }
    }

    // population
    if (populationTotal < 0) {
        error('population_total', 'La population ne peut pas être négative');
    }

    if (populationCouples < 0) {
        error('population_couples', 'Le nombre de ménages ne peut pas être négatif');
    }

    if (populationMinors < 0) {
        error('population_minors', 'Le nombre de mineurs ne peut pas être négatif');
    }

    // access to electricty
    if (accessToElectricity === null) {
        error('access_to_electricity', 'Le champ "Accès à l\'éléctricité" est obligatoire');
    } else if ([-1, 0, 1].indexOf(accessToElectricity) === -1) {
        error('access_to_electricity', 'Valeur invalide');
    }

    // access to water
    if (accessToWater === null) {
        error('access_to_water', 'Le champ "Accès à l\'eau" est obligatoire');
    } else if ([-1, 0, 1].indexOf(accessToWater) === -1) {
        error('access_to_water', 'Valeur invalide');
    }

    // trash evacuatioon
    if (trashEvacuation === null) {
        error('trash_evacuation', 'Le champ "Évacuation des déchets" est obligatoire');
    } else if ([-1, 0, 1].indexOf(trashEvacuation) === -1) {
        error('trash_evacuation', 'Valeur invalide');
    }

    return fieldErrors;
}

function parseTown(town) {
    return {
        id: town.id,
        priority: town.priority,
        status: town.status,
        closedAt: town.closedat ? new Date(town.closedat).getTime() / 1000 : null,
        latitude: town.latitude,
        longitude: town.longitude,
        address: town.address,
        addressDetails: town.addressdetails,
        city: {
            code: town.citycode,
            name: town.city,
        },
        builtAt: town.builtat ? new Date(town.builtat).getTime() / 1000 : null,
        fieldType: {
            id: town.fieldtypeid,
            label: town.fieldtype,
        },
        ownerType: {
            id: town.ownertypeid,
            label: town.ownertype,
        },
        populationTotal: town.populationtotal,
        populationCouples: town.populationcouples,
        populationMinors: town.populationminors,
        accessToElectricity: town.accesstoelectricity,
        accessToWater: town.accesstowater,
        trashEvacuation: town.trashevacuation,
        justiceStatus: town.justicestatus,
        actions: [],
        comments: [],
        socialOrigins: [],
        owner: town.owner,
        declaredAt: town.declared_at !== null ? new Date(town.declared_at).getTime() / 1000 : null,
        censusStatus: town.census_status,
        censusRequestedAt: town.census_requested_at !== null ? new Date(town.census_requested_at).getTime() / 1000 : null,
        censusConductedAt: town.census_conducted_at !== null ? new Date(town.census_conducted_at).getTime() / 1000 : null,
        censusConductedBy: town.census_conducted_by,
        justiceRenderedBy: town.justice_rendered_by,
        justiceRenderedAt: town.justice_rendered_at !== null ? new Date(town.justice_rendered_at).getTime() / 1000 : null,
        policeStatus: town.police_status,
        policeRequestedAt: town.police_requested_at !== null ? new Date(town.police_requested_at).getTime() / 1000 : null,
        policeGrantedAt: town.police_granted_at ? new Date(town.police_granted_at).getTime() / 1000 : null,
        bailiff: town.bailiff,
        updatedAt: Math.round(new Date(town.updatedat).getTime() / 1000),
    };
}

function parseAction(town) {
    return {
        id: town.actionid,
        startedAt: Math.round(new Date(town.actionstartedat).getTime() / 1000),
        endedAt: town.actionendedat ? Math.round(new Date(town.actionstartedat).getTime() / 1000) : null,
        name: town.actionname,
        description: town.actiondescription,
        type: town.actiontype,
    };
}

function parseOrigin(town) {
    return {
        id: town.socialoriginid,
        label: town.socialorigin,
    };
}

function parseTowns(towns) {
    const used = {};
    const usedOrigins = {};

    for (let i = 0, len = towns.length; i < len; i += 1) {
        const town = towns[i];
        if (used[town.id] === undefined) {
            used[town.id] = parseTown(town);
        }

        const parsed = used[town.id];
        if (town.socialoriginid !== null && usedOrigins[town.socialoriginid] === undefined) {
            usedOrigins[town.socialoriginid] = parseOrigin(town);
            parsed.socialOrigins.push(usedOrigins[town.socialoriginid]);
        }
    }

    return used;
}

function serializeComment(comment) {
    return {
        description: comment.description,
        createdAt: new Date(comment.createdat || comment.createdAt).getTime() / 1000,
        createdBy: comment.createdby || comment.createdBy,
    };
}

async function fetchTowns(where = []) {
    // get the towns with their related social origins
    const towns = parseTowns(
        await sequelize.query(
            `${'SELECT'
            // shantytown
            + ' s.shantytown_id AS id, s.priority as priority, s.status as status, s.closed_at AS closedAt, s.latitude AS latitude,'
            + ' s.longitude AS longitude, s.address AS address, s.address_details AS addressDetails,'
            + ' s.built_at as builtAt, s.population_total as populationTotal, s.population_couples AS populationCouples,'
            + ' s.population_minors AS populationMinors, s.access_to_electricity AS accessToElectricity,'
            + ' s.access_to_water AS accessToWater, s.trash_evacuation AS trashEvacuation,'
            + ' s.justice_status AS justiceStatus, s.created_at AS createdAt, s.updated_at AS updatedAt,'
            + ' s.owner AS owner, s.census_status, s.census_requested_at, s.census_conducted_at, s.census_conducted_by,'
            + ' s.justice_rendered_by, s.justice_rendered_at, s.police_status, s.police_requested_at, s.police_granted_at,'
            + ' s.bailiff,'
            // field_type
            + ' f.field_type_id AS fieldTypeId, f.label AS fieldType,'
            // owner_type
            + ' o.owner_type_id AS ownerTypeId, o.label AS ownerType,'
            // origins
            + ' social.social_origin_id AS socialOriginId, social.label AS socialOrigin,'
            // city
            + ' c.code AS cityCode, c.name AS city'

            + ' FROM shantytowns s'
            + ' LEFT JOIN field_types f ON s.fk_field_type = f.field_type_id'
            + ' LEFT JOIN owner_types o ON s.fk_owner_type = o.owner_type_id'
            + ' LEFT JOIN shantytown_origins so ON so.fk_shantytown = s.shantytown_id'
            + ' LEFT JOIN social_origins social ON so.fk_social_origin = social.social_origin_id'
            + ' LEFT JOIN cities c ON s.fk_city = c.code'}${
                where.length > 0 ? (` WHERE ${where.join(' AND ')}`) : ''}`,
            { type: sequelize.QueryTypes.SELECT },
        ),
    );

    // get the related comments
    const comments = await sequelize.query(
        'SELECT'
        // shantytown
        + ' s.shantytown_id,'
        // comment
        + ' c.description, c.created_at AS createdAt, c.created_by AS createdBy'
        + ' FROM shantytown_comments c'
        + ' LEFT JOIN shantytowns s ON c.fk_shantytown = s.shantytown_id'
        + ` WHERE c.fk_shantytown IN (${Object.keys(towns).join(',')})`,
        { type: sequelize.QueryTypes.SELECT },
    );

    comments.forEach((comment) => {
        towns[comment.shantytown_id].comments.push(serializeComment(comment));
    });

    // get the related actions
    const actions = await sequelize.query(
        'SELECT'
        // shantytown
        + ' s.shantytown_id,'
        // action
        + ' a.action_id AS actionId, a.started_at AS actionStartedAt, a.ended_at AS actionEndedAt, a.name AS actionName, a.description AS actionDescriptioon, at.label AS actiontype'
        + ' FROM shantytowns s'
        + ' LEFT JOIN cities c ON s.fk_city = c.code'
        + ' LEFT JOIN epci e ON c.fk_epci = e.code'
        + ' LEFT JOIN departements d ON e.fk_departement = d.code'
        + ' LEFT JOIN regions r ON d.fk_region = r.code'
        + ' RIGHT JOIN actions a ON a.fk_city = c.code OR a.fk_epci = e.code OR a.fk_departement = d.code OR a.fk_region = r.code'
        + ' LEFT JOIN action_types at ON a.fk_action_type = at.action_type_id'
        + ` WHERE s.shantytown_id IN (${Object.keys(towns).join(',')})`,
        { type: sequelize.QueryTypes.SELECT },
    );

    actions.forEach((action) => {
        towns[action.shantytown_id].actions.push(parseAction(action));
    });

    return Object.values(towns);
}

module.exports = {
    async list(req, res) {
        try {
            return res.status(200).send(await fetchTowns());
        } catch (error) {
            return res.status(400).send(error);
        }
    },

    async find(req, res) {
        try {
            const towns = await fetchTowns([
                `s.shantytown_id = ${parseInt(req.params.id, 10)}`,
            ]);

            if (towns.length !== 1) {
                return res.status(404).send({
                    error: {
                        developer_message: 'The requested town does not exist',
                        user_message: 'Le site demandé n\'existe pas en base de données',
                    },
                });
            }

            return res.status(200).send(towns.shift());
        } catch (error) {
            return res.status(400).send(error);
        }
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

        // create the town
        const {
            priority,
            address,
            citycode,
            latitude,
            longitude,
            addressDetails,
            builtAt,
            populationTotal,
            populationCouples,
            populationMinors,
            accessToElectricity,
            accessToWater,
            trashEvacuation,
            justiceStatus,
            fieldType,
            ownerType,
            socialOrigins,
            owner,
            declaredAt,
            censusStatus,
            censusRequestedAt,
            censusConductedAt,
            censusConductedBy,
            justiceRenderedBy,
            justiceRenderedAt,
            policeStatus,
            policeRequestedAt,
            policeGrantedAt,
            bailiff,
        } = cleanParams(req.body);

        try {
            let town;
            await sequelize.transaction(async () => {
                town = await ShantyTowns.create({
                    priority,
                    latitude,
                    longitude,
                    address,
                    addressDetails,
                    builtAt,
                    populationTotal,
                    populationCouples,
                    populationMinors,
                    accessToElectricity: toBool(accessToElectricity),
                    accessToWater: toBool(accessToWater),
                    trashEvacuation: toBool(trashEvacuation),
                    justiceStatus,
                    fieldType,
                    ownerType,
                    city: citycode,
                    createdBy: req.decoded.userId,
                    owner,
                    declaredAt,
                    censusStatus,
                    censusRequestedAt,
                    censusConductedAt,
                    censusConductedBy,
                    justiceRenderedBy,
                    justiceRenderedAt,
                    policeStatus,
                    policeRequestedAt,
                    policeGrantedAt,
                    bailiff,
                });

                await town.setSocialOrigins(socialOrigins);
            });

            return res.status(200).send(town);
        } catch (e) {
            return res.status(500).send({
                error: {
                    developer_message: e.message,
                    user_message: 'Une erreur est survenue dans l\'enregistrement du site en base de données',
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

        // check if the town exists
        const town = await ShantyTowns.findOne({
            where: {
                shantytown_id: req.params.id,
            },
        });

        if (town === null) {
            return res.status(400).send({
                error: {
                    developer_message: `Tried to update unknown town of id #${req.params.id}`,
                    user_message: `Le site d'identifiant ${req.params.id} n'existe pas : mise à jour impossible`,
                },
            });
        }

        // edit the town
        const {
            priority,
            builtAt,
            status,
            closedAt,
            address,
            citycode,
            latitude,
            longitude,
            addressDetails,
            populationTotal,
            populationCouples,
            populationMinors,
            accessToElectricity,
            accessToWater,
            trashEvacuation,
            justiceStatus,
            fieldType,
            ownerType,
            socialOrigins,
        } = cleanParams(req.body);

        try {
            await sequelize.transaction(async () => {
                await town.update({
                    priority,
                    builtAt,
                    status,
                    closedAt,
                    latitude,
                    longitude,
                    address,
                    addressDetails,
                    populationTotal,
                    populationCouples,
                    populationMinors,
                    accessToElectricity: toBool(accessToElectricity),
                    accessToWater: toBool(accessToWater),
                    trashEvacuation: toBool(trashEvacuation),
                    justiceStatus,
                    fieldType,
                    ownerType,
                    city: citycode,
                    updatedBy: req.decoded.userId,
                });

                await town.setSocialOrigins(socialOrigins);
            });

            return res.status(200).send(town);
        } catch (e) {
            return res.status(500).send({
                error: {
                    developer_message: e.message,
                    user_message: 'Une erreur est survenue dans l\'enregistrement du site en base de données',
                },
            });
        }
    },

    async delete(req, res) {
        // check if the town exists
        const town = await ShantyTowns.findOne({
            where: {
                shantytown_id: req.params.id,
            },
        });

        if (town === null) {
            return res.status(400).send({
                error: {
                    developer_message: `Tried to delete unknown town of id #${req.params.id}`,
                    user_message: `Le site d'identifiant ${req.params.id} n'existe pas : suppression impossible`,
                },
            });
        }

        // delete the town
        try {
            await town.destroy();
            return res.status(200).send({});
        } catch (e) {
            return res.status(500).send({
                error: {
                    developer_message: e.message,
                    user_message: 'Une erreur est survenue pendant la suppression du site de la base de données',
                },
            });
        }
    },

    async addComment(req, res) {
        const {
            description,
        } = req.body;

        // get the related town
        let shantytown;
        try {
            shantytown = await ShantyTowns.findOne({
                where: {
                    shantytown_id: req.params.id,
                },
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to retrieve the shantytown',
                    user_message: 'Impossible de retrouver le site concerné en base de données',
                },
            });
        }

        if (shantytown === null) {
            return res.status(404).send({
                error: {
                    developer_message: 'Shantytown does not exist',
                    user_message: 'Le site concerné par le commentaire n\'existe pas',
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
            await ShantyTownComments.create({
                shantytown: shantytown.id,
                description: trimmedDescription,
                createdBy: req.decoded.userId,
            });

            const comments = await ShantyTownComments.findAll({
                where: {
                    shantytown: shantytown.id,
                },
            });
            return res.status(200).send({
                comments: comments.map(serializeComment),
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
