const { sequelize } = require('#db/models');
const Cities = require('#db/models').City;
const ShantyTowns = require('#db/models').Shantytown;
const ShantyTownComments = require('#db/models').ShantytownComment;
const { ClosingSolution } = require('#db/models');

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

function ucfirst(str) {
    return str[0].toUpperCase() + str.slice(1);
}

function toCamel(str) {
    const atoms = str.split('_');
    return atoms[0] + atoms.slice(1).map(ucfirst).join('');
}

function toUnderscore(str) {
    const atoms = str.split(/[A-Z]+/);
    const capitals = str.match(/[A-Z]+/g);

    if (capitals === null) {
        return str;
    }

    return atoms[0] + capitals.map((capital, index) => (`_${capital.toLowerCase()}${atoms[index + 1]}`)).join('');
}

function toFormat(str, format) {
    if (format === 'underscore') {
        return toUnderscore(str);
    }

    if (format === 'camel') {
        return toCamel(str);
    }

    return str;
}

function hasPermission(permissions, permission) {
    return permissions[permission.type] && permissions[permission.type].indexOf(permission.name) !== -1;
}

function cleanParams(body, format) {
    let priority;
    let built_at;
    let status;
    let closed_at;
    let latitude;
    let longitude;
    let city;
    let citycode;
    let address;
    let detailed_address;
    let population_total;
    let population_couples;
    let population_minors;
    let electricity_type;
    let access_to_water;
    let trash_evacuation;
    let owner_complaint;
    let justice_procedure;
    let justice_rendered;
    let justice_rendered_by;
    let justice_rendered_at;
    let justice_challenged;
    let social_origins;
    let field_type;
    let owner_type;
    let owner;
    let declared_at;
    let census_status;
    let census_conducted_at;
    let census_conducted_by;
    let police_status;
    let police_requested_at;
    let police_granted_at;
    let bailiff;
    let solutions;

    if (format === 'camel') {
        ({
            priority,
            builtAt: built_at,
            status,
            closedAt: closed_at,
            latitude,
            longitude,
            city,
            citycode,
            address,
            detailedAddress: detailed_address,
            populationTotal: population_total,
            populationCouples: population_couples,
            populationMinors: population_minors,
            electricityType: electricity_type,
            accessToWater: access_to_water,
            trashEvacuation: trash_evacuation,
            ownerComplaint: owner_complaint,
            justiceProcedure: justice_procedure,
            justiceRendered: justice_rendered,
            justiceRenderedBy: justice_rendered_by,
            justiceRenderedAt: justice_rendered_at,
            justiceChallenged: justice_challenged,
            socialOrigins: social_origins,
            fieldType: field_type,
            ownerType: owner_type,
            owner,
            declaredAt: declared_at,
            censusStatus: census_status,
            censusConductedAt: census_conducted_at,
            censusConductedBy: census_conducted_by,
            policeStatus: police_status,
            policeRequestedAt: police_requested_at,
            policeGrantedAt: police_granted_at,
            bailiff,
            solutions,
        } = body);
    } else {
        ({
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
            electricity_type,
            access_to_water,
            trash_evacuation,
            owner_complaint,
            justice_procedure,
            justice_rendered,
            justice_rendered_by,
            justice_rendered_at,
            justice_challenged,
            social_origins,
            field_type,
            owner_type,
            owner,
            declared_at,
            census_status,
            census_conducted_at,
            census_conducted_by,
            police_status,
            police_requested_at,
            police_granted_at,
            bailiff,
            solutions,
        } = body);
    }

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
        electricityType: getIntOrNull(electricity_type),
        accessToWater: getIntOrNull(access_to_water),
        trashEvacuation: getIntOrNull(trash_evacuation),
        ownerComplaint: getIntOrNull(owner_complaint),
        justiceProcedure: getIntOrNull(justice_procedure),
        justiceRendered: getIntOrNull(justice_rendered),
        justiceRenderedBy: trim(justice_rendered_by),
        justiceRenderedAt: justice_rendered_at !== '' ? justice_rendered_at : null,
        justiceChallenged: getIntOrNull(justice_challenged),
        socialOrigins: social_origins || [],
        fieldType: getIntOrNull(field_type),
        ownerType: getIntOrNull(owner_type),
        owner: trim(owner),
        declaredAt: declared_at !== '' ? declared_at : null,
        censusStatus: trim(census_status),
        censusConductedAt: census_conducted_at !== '' ? census_conducted_at : null,
        censusConductedBy: trim(census_conducted_by),
        policeStatus: trim(police_status),
        policeRequestedAt: police_requested_at !== '' ? police_requested_at : null,
        policeGrantedAt: police_granted_at !== '' ? police_granted_at : null,
        bailiff: trim(bailiff),
        solutions: solutions ? solutions.map(solution => ({
            id: parseInt(solution.id, 10),
            peopleAffected: getIntOrNull(solution.peopleAffected),
            householdsAffected: getIntOrNull(solution.householdsAffected),
        })) : [],
    };
}

async function validateInput(body, format = 'underscore') {
    const {
        priority,
        builtAt,
        address,
        city,
        citycode,
        latitude,
        longitude,
        populationTotal,
        populationCouples,
        populationMinors,
        electricityType,
        accessToWater,
        trashEvacuation,
        ownerComplaint,
        justiceProcedure,
        justiceRendered,
        justiceRenderedAt,
        justiceChallenged,
        fieldType,
        ownerType,
        declaredAt,
    } = cleanParams(body, format);

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
    if (!builtAt) {
        error(toFormat('built_at', format), 'La date d\'installation est obligatoire.');
    } else {
        builtAtTimestamp = new Date(builtAt).getTime();

        if (Number.isNaN(builtAtTimestamp)) {
            error(toFormat('built_at', format), 'La date fournie n\'est pas reconnue');
        } else if (builtAtTimestamp >= now) {
            error(toFormat('built_at', format), 'La date d\'installation ne peut pas être future');
        }
    }

    // declaredAt
    let declaredAtTimestamp = null;
    if (declaredAt) {
        declaredAtTimestamp = new Date(declaredAt).getTime();

        if (Number.isNaN(declaredAtTimestamp)) {
            error(toFormat('declared_at', format), 'La date fournie n\'est pas reconnue');
        } else if (declaredAtTimestamp >= now) {
            error(toFormat('declared_at', format), 'La date de signalement ne peut pas être future');
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
        error(toFormat('field_type', format), 'Le champ "type de site" est obligatoire');
    }

    // owner type
    if (ownerType === null) {
        error(toFormat('owner_type', format), 'Le champ "type de propriétaire" est obligatoire');
    }

    // justice status
    if (ownerComplaint === null) {
        error(toFormat('owner_complaint', format), 'Le champ "Dépôt de plainte par le propriétaire" est obligatoire');
    } else if ([-1, 0, 1].indexOf(ownerComplaint) === -1) {
        error(toFormat('owner_complaint', format), 'Valeur invalide');
    }

    if (ownerComplaint === 1) {
        if (justiceProcedure === null) {
            error(toFormat('justice_procedure', format), 'Le champ "Existence d\'une procédure judiciaire" est obligatoire');
        } else if ([-1, 0, 1].indexOf(justiceProcedure) === -1) {
            error(toFormat('justice_procedure', format), 'Valeur invalide');
        }

        if (justiceProcedure === 1) {
            if (justiceRendered === null) {
                error(toFormat('justice_rendered', format), 'Le champ "Décision de justice rendue" est obligatoire');
            } else if ([-1, 0, 1].indexOf(justiceRendered) === -1) {
                error(toFormat('justice_rendered', format), 'Valeur invalide');
            }

            if (justiceRendered === 1) {
                if (justiceChallenged === null) {
                    error(toFormat('justice_challenged', format), 'Le champ "Contentieux relatif à la décision de justice" est obligatoire');
                } else if ([-1, 0, 1].indexOf(justiceChallenged) === -1) {
                    error(toFormat('justice_challenged', format), 'Valeur invalide');
                }

                if (justiceRenderedAt !== '') {
                    const justiceRenderedAtTimestamp = new Date(justiceRenderedAt).getTime();

                    if (Number.isNaN(justiceRenderedAtTimestamp)) {
                        error(toFormat('justice_rendered_at', format), 'La date fournie n\'est pas reconnue');
                    } else if (justiceRenderedAtTimestamp >= now) {
                        error(toFormat('justice_rendered_at', format), 'La date ne peut pas être future');
                    }
                }
            }
        }
    }

    // population
    if (populationTotal < 0) {
        error(toFormat('population_total', format), 'La population ne peut pas être négative');
    }

    if (populationCouples < 0) {
        error(toFormat('population_couples', format), 'Le nombre de ménages ne peut pas être négatif');
    }

    if (populationMinors < 0) {
        error(toFormat('population_minors', format), 'Le nombre de mineurs ne peut pas être négatif');
    }

    // access to electricty
    if (electricityType === null) {
        error(toFormat('electricity_type', format), 'Le champ "Accès à l\'éléctricité" est obligatoire');
    }

    // access to water
    if (accessToWater === null) {
        error(toFormat('access_to_water', format), 'Le champ "Accès à l\'eau" est obligatoire');
    } else if ([-1, 0, 1].indexOf(accessToWater) === -1) {
        error(toFormat('access_to_water', format), 'Valeur invalide');
    }

    // trash evacuatioon
    if (trashEvacuation === null) {
        error(toFormat('trash_evacuation', format), 'Le champ "Évacuation des déchets" est obligatoire');
    } else if ([-1, 0, 1].indexOf(trashEvacuation) === -1) {
        error(toFormat('trash_evacuation', format), 'Valeur invalide');
    }

    return fieldErrors;
}

function serializeComment(comment) {
    return {
        id: comment.commentId,
        description: comment.commentDescription,
        createdAt: comment.commentCreatedAt !== null ? (comment.commentCreatedAt.getTime() / 1000) : null,
        createdBy: {
            id: comment.commentCreatedBy,
            firstName: comment.userFirstName,
            lastName: comment.userLastName,
            company: comment.userCompany,
        },
    };
}

module.exports = models => ({
    async list(req, res) {
        try {
            const filters = {};
            if (req.query.status) {
                filters.status = req.query.status.split(',');
            }

            return res.status(200).send(
                await models.shantytown.findAll(req.user.permissions.data, req.user.departement, filters),
            );
        } catch (error) {
            return res.status(500).send(error.message);
        }
    },

    async find(req, res) {
        try {
            const town = await models.shantytown.findOne(req.params.id, req.user.permissions.data, req.user.departement);

            if (town === null) {
                return res.status(404).send({
                    error: {
                        developer_message: 'The requested town does not exist',
                        user_message: 'Le site demandé n\'existe pas en base de données',
                    },
                });
            }

            return res.status(200).send(town);
        } catch (error) {
            return res.status(500).send(error.message);
        }
    },

    async add(req, res) {
        // check errors
        let fieldErrors = {};
        try {
            fieldErrors = await validateInput(req.body, 'camel');
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
            electricityType,
            accessToWater,
            trashEvacuation,
            fieldType,
            ownerType,
            socialOrigins,
            owner,
            declaredAt,
            censusStatus,
            censusConductedAt,
            censusConductedBy,
            ownerComplaint,
            justiceProcedure,
            justiceRendered,
            justiceRenderedBy,
            justiceRenderedAt,
            justiceChallenged,
            policeStatus,
            policeRequestedAt,
            policeGrantedAt,
            bailiff,
        } = cleanParams(req.body, 'camel');

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
                    electricityType,
                    accessToWater: toBool(accessToWater),
                    trashEvacuation: toBool(trashEvacuation),
                    fieldType,
                    ownerType,
                    city: citycode,
                    createdBy: req.user.id,
                    owner,
                    declaredAt,
                    censusStatus,
                    censusConductedAt,
                    censusConductedBy,
                    ownerComplaint: toBool(ownerComplaint),
                    justiceProcedure: toBool(justiceProcedure),
                    justiceRendered: toBool(justiceRendered),
                    justiceRenderedBy,
                    justiceRenderedAt,
                    justiceChallenged: toBool(justiceChallenged),
                    policeStatus,
                    policeRequestedAt,
                    policeGrantedAt,
                    bailiff,
                });

                await town.setSocialOrigins(socialOrigins);
            });

            const departements = await sequelize.query(
                `SELECT
                    departements.code
                FROM
                    shantytowns
                LEFT JOIN cities ON cities.code = shantytowns.fk_city
                LEFT JOIN departements ON departements.code = cities.fk_departement
                WHERE shantytowns.shantytown_id = :id`,
                {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: {
                        id: town.id,
                    },
                },
            );

            const plans = await sequelize.query(
                `SELECT
                    plans.plan_id AS id,
                    plans.name,
                    plan_types.label AS type,
                    departements.name AS departement
                FROM
                    plans
                LEFT JOIN plan_types ON plan_types.plan_type_id = plans.fk_type
                LEFT JOIN departements ON departements.code = plans.fk_departement
                WHERE plans.fk_departement = :departement AND plans.ended_at IS NULL AND plans.targeted_on_towns = TRUE`,
                {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: {
                        departement: departements[0].code,
                    },
                },
            );

            return res.status(200).send({
                town,
                plans,
            });
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
            declaredAt,
            builtAt,
            status,
            closedAt,
            address,
            citycode,
            latitude,
            longitude,
            addressDetails,
            censusStatus,
            censusConductedAt,
            censusConductedBy,
            populationTotal,
            populationCouples,
            populationMinors,
            electricityType,
            accessToWater,
            trashEvacuation,
            fieldType,
            ownerType,
            owner,
            socialOrigins,
            ownerComplaint,
            justiceProcedure,
            justiceRendered,
            justiceRenderedBy,
            justiceRenderedAt,
            justiceChallenged,
            policeStatus,
            policeRequestedAt,
            policeGrantedAt,
            bailiff,
        } = cleanParams(req.body);

        try {
            await sequelize.transaction(async () => {
                await town.update({
                    priority,
                    declaredAt,
                    builtAt,
                    status,
                    closedAt,
                    latitude,
                    longitude,
                    address,
                    addressDetails,
                    censusStatus,
                    censusConductedAt,
                    censusConductedBy,
                    populationTotal,
                    populationCouples,
                    populationMinors,
                    electricityType,
                    accessToWater: toBool(accessToWater),
                    trashEvacuation: toBool(trashEvacuation),
                    fieldType,
                    ownerType,
                    owner,
                    city: citycode,
                    updatedBy: req.user.id,
                    ownerComplaint: toBool(ownerComplaint),
                    justiceProcedure: toBool(justiceProcedure),
                    justiceRendered: toBool(justiceRendered),
                    justiceRenderedBy,
                    justiceRenderedAt,
                    justiceChallenged: toBool(justiceChallenged),
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

    async close(req, res) {
        const {
            status,
            closedAt,
            solutions,
        } = cleanParams(req.body);

        const now = Date.now();
        const fieldErrors = {};
        const error = addError.bind(this, fieldErrors);

        const closingSolutions = await ClosingSolution.findAll();

        // validate the status
        if (status === null) {
            error('status', 'La cause de fermeture du site est obligatoire');
        } else if (['open', 'closed_by_justice', 'closed_by_admin', 'other', 'unknown'].indexOf(status) === -1) {
            error('status', 'La cause de fermeture du site fournie n\'est pas reconnue');
        }

        // validate the closed-at date
        if (status !== 'open') {
            const timestamp = new Date(closedAt).getTime();

            if (!closedAt || Number.isNaN(timestamp)) {
                error('closed_at', 'La date fournie n\'est pas reconnue');
            } else if (timestamp >= now) {
                error('closed_at', 'La date de fermeture du site ne peut pas être future');
            }
        }

        // validate the list of solutions
        const solutionErrors = {};
        solutions.forEach((solution) => {
            if (closingSolutions.some(s => s.id === solution.id) === false) {
                addError(solutionErrors, solution.id, `Le dispositif d'identifiant ${solution.id} n'existe pas`);
            }

            if (solution.peopleAffected !== null) {
                if (Number.isNaN(solution.peopleAffected)) {
                    addError(solutionErrors, solution.id, 'Le nombre de personnes concernées par le dispositif est invalide');
                } else if (solution.peopleAffected <= 0) {
                    addError(solutionErrors, solution.id, 'Le nombre de personnes concernées par le dispositif doit être positif');
                }
            }

            if (solution.householdsAffected !== null) {
                if (Number.isNaN(solution.householdsAffected)) {
                    addError(solutionErrors, solution.id, 'Le nombre de ménages concernés par le dispositif est invalide');
                } else if (solution.householdsAffected <= 0) {
                    addError(solutionErrors, solution.id, 'Le nombre de ménages concernés par le dispositif doit être positif');
                }
            }
        });

        if (Object.keys(solutionErrors).length > 0) {
            fieldErrors.solutions = solutionErrors;
        }

        // check errors
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
                    developer_message: `Tried to close unknown town of id #${req.params.id}`,
                    user_message: `Le site d'identifiant ${req.params.id} n'existe pas : fermeture impossible`,
                },
            });
        }

        // close the town
        try {
            await sequelize.transaction(async () => {
                await town.update({
                    status,
                    closedAt,
                    updatedBy: req.user.id,
                });

                await Promise.all(
                    solutions.map(solution => town.addClosingSolution(solution.id, {
                        through: {
                            peopleAffected: solution.peopleAffected,
                            householdsAffected: solution.householdsAffected,
                        },
                    })),
                );
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
                createdBy: req.user.id,
            });

            const rawComments = await sequelize.query(
                `SELECT
                    shantytown_comments.shantytown_comment_id AS "commentId",
                    shantytown_comments.fk_shantytown AS "shantytownId",
                    shantytown_comments.description AS "commentDescription",
                    shantytown_comments.created_at AS "commentCreatedAt",
                    shantytown_comments.created_by AS "commentCreatedBy",
                    users.first_name AS "userFirstName",
                    users.last_name AS "userLastName",
                    users.company AS "userCompany"
                FROM shantytown_comments
                LEFT JOIN users ON shantytown_comments.created_by = users.user_id
                WHERE shantytown_comments.fk_shantytown = :id
                ORDER BY shantytown_comments.created_at DESC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: {
                        id: shantytown.id,
                    },
                },
            );

            return res.status(200).send({
                comments: rawComments.map(serializeComment),
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

    async updateComment(req, res) {
        let comment;
        try {
            comment = await ShantyTownComments.findOne({
                where: {
                    shantytown_comment_id: req.params.commentId,
                },
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to retrieve the comment',
                    user_message: 'Impossible de retrouver le commentaire à modifier en base de données',
                },
            });
        }

        if (!hasPermission(req.user.permissions, { type: 'feature', name: 'updateComment' })
            && (comment.createdBy !== req.user.id || !hasPermission(req.user.permissions, { type: 'feature', name: 'updateOwnComment' }))) {
            return res.status(400).send({
                error: {
                    user_message: 'Vous n\'avez pas accès à ces données',
                    developer_message: 'Tried to access a secured page without authentication',
                },
            });
        }

        try {
            await sequelize.query(
                'UPDATE shantytown_comments SET description = :description WHERE shantytown_comment_id = :id',
                {
                    replacements: {
                        id: req.params.commentId,
                        description: req.body.description,
                    },
                },
            );

            const rawComments = await sequelize.query(
                `SELECT
                    shantytown_comments.shantytown_comment_id AS "commentId",
                    shantytown_comments.fk_shantytown AS "shantytownId",
                    shantytown_comments.description AS "commentDescription",
                    shantytown_comments.created_at AS "commentCreatedAt",
                    shantytown_comments.created_by AS "commentCreatedBy",
                    users.first_name AS "userFirstName",
                    users.last_name AS "userLastName",
                    users.company AS "userCompany"
                FROM shantytown_comments
                LEFT JOIN users ON shantytown_comments.created_by = users.user_id
                WHERE shantytown_comments.fk_shantytown = :id
                ORDER BY shantytown_comments.created_at DESC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: {
                        id: req.params.id,
                    },
                },
            );

            return res.status(200).send({
                comments: rawComments.map(serializeComment),
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to update the comment',
                    user_message: 'Impossible de modifier le commentaire',
                },
            });
        }
    },

    async deleteComment(req, res) {
        let comment;
        try {
            comment = await ShantyTownComments.findOne({
                where: {
                    shantytown_comment_id: req.params.commentId,
                },
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to retrieve the comment',
                    user_message: 'Impossible de retrouver le commentaire à supprimer en base de données',
                },
            });
        }

        if (!hasPermission(req.user.permissions, { type: 'feature', name: 'deleteComment' })
            && (comment.createdBy !== req.user.id || !hasPermission(req.user.permissions, { type: 'feature', name: 'deleteOwnComment' }))) {
            return res.status(400).send({
                error: {
                    user_message: 'Vous n\'avez pas accès à ces données',
                    developer_message: 'Tried to access a secured page without authentication',
                },
            });
        }

        try {
            await sequelize.query(
                'DELETE FROM shantytown_comments WHERE shantytown_comment_id = :id',
                {
                    replacements: {
                        id: req.params.commentId,
                    },
                },
            );

            const rawComments = await sequelize.query(
                `SELECT
                    shantytown_comments.shantytown_comment_id AS "commentId",
                    shantytown_comments.fk_shantytown AS "shantytownId",
                    shantytown_comments.description AS "commentDescription",
                    shantytown_comments.created_at AS "commentCreatedAt",
                    shantytown_comments.created_by AS "commentCreatedBy",
                    users.first_name AS "userFirstName",
                    users.last_name AS "userLastName",
                    users.company AS "userCompany"
                FROM shantytown_comments
                LEFT JOIN users ON shantytown_comments.created_by = users.user_id
                WHERE shantytown_comments.fk_shantytown = :id
                ORDER BY shantytown_comments.created_at DESC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                    replacements: {
                        id: req.params.id,
                    },
                },
            );

            return res.status(200).send({
                comments: rawComments.map(serializeComment),
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'Failed to delete the comment',
                    user_message: 'Impossible de supprimer le commentaire',
                },
            });
        }
    },

});
