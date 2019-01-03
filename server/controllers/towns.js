const { sequelize } = require('../../db/models');
const Cities = require('../../db/models').City;
const FieldTypes = require('../../db/models').FieldType;
const OwnerTypes = require('../../db/models').OwnerType;
const SocialOrigins = require('../../db/models').SocialOrigin;
const ShantyTowns = require('../../db/models').Shantytown;

function serializeTown(town) {
    return {
        id: town.id,
        status: town.status,
        closedAt: town.closedAt ? new Date(town.closedAt).getTime() / 1000 : null,
        latitude: town.latitude,
        longitude: town.longitude,
        address: town.address,
        addressDetails: town.addressDetails,
        city: {
            code: town.City.code,
            name: town.City.name,
        },
        builtAt: town.builtAt ? new Date(town.builtAt).getTime() / 1000 : null,
        fieldType: {
            id: town.FieldType.id,
            label: town.FieldType.label,
        },
        ownerType: {
            id: town.OwnerType.id,
            label: town.OwnerType.label,
        },
        populationTotal: town.populationTotal,
        populationCouples: town.populationCouples,
        populationMinors: town.populationMinors,
        accessToElectricity: town.accessToElectricity,
        accessToWater: town.accessToWater,
        trashEvacuation: town.trashEvacuation,
        justiceStatus: town.justiceStatus,
        actions: [],
        socialOrigins: town.socialOrigins.map(origin => ({
            id: origin.id,
            label: origin.label,
        })),
        updatedAt: new Date(town.updatedAt).getTime() / 1000,
    };
}

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
        social_origins,
        field_type,
        owner_type,
    } = body;

    return {
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
        justiceStatus: getIntOrNull(justice_status),
        socialOrigins: social_origins,
        fieldType: getIntOrNull(field_type),
        ownerType: getIntOrNull(owner_type),
    };
}

async function validateInput(body, mode = 'create') {
    const {
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
        fieldType,
        ownerType,
    } = cleanParams(body);

    const now = Date.now();
    const fieldErrors = {};
    const error = addError.bind(this, fieldErrors);

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

    // status
    if (mode === 'edit') {
        if (status === null) {
            error('status', 'La cause de fermeture du site est obligatoire');
        } else if (['open', 'gone', 'expelled', 'covered'].indexOf(status) === -1) {
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
    } else if ([-1, 0, 1].indexOf(justiceStatus) === -1) {
        error('justice_status', 'Valeur invalide');
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

module.exports = {
    list(req, res) {
        try {
            return ShantyTowns
                .findAll({
                    include: [
                        Cities,
                        FieldTypes,
                        OwnerTypes,
                        { model: SocialOrigins, as: 'socialOrigins' },
                    ],
                    where: {
                        status: 'open',
                    },
                })
                .then(towns => res.status(200).send(towns.map(serializeTown)))
                .catch(error => res.status(400).send(error));
        } catch (error) {
            return res.status(400).send(error);
        }
    },

    async find(req, res) {
        return ShantyTowns
            .findOne({
                include: [
                    Cities,
                    FieldTypes,
                    OwnerTypes,
                    { model: SocialOrigins, as: 'socialOrigins' },
                ],
                where: {
                    shantytown_id: req.params.id,
                },
            })
            .then(town => res.status(200).send(serializeTown(town)))
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

        // create the town
        const {
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
        } = cleanParams(req.body);

        try {
            let town;

            await sequelize.transaction(async () => {
                town = await ShantyTowns.create({
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
                    justiceStatus: toBool(justiceStatus),
                    fieldType,
                    ownerType,
                    city: citycode,
                    createdBy: req.decoded.userId,
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
                town.update({
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
                    justiceStatus: toBool(justiceStatus),
                    fieldType,
                    ownerType,
                    city: citycode,
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
};
