const cleanParams = require('./cleanParams');

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

function addError(errors, field, error) {
    if (!Object.prototype.hasOwnProperty.call(errors, field)) {
        // eslint-disable-next-line no-param-reassign
        errors[field] = [];
    }

    errors[field].push(error);
}

module.exports = async function validateInput(models, body, user, permission, format = 'underscore') {
    const {
        priority,
        builtAt,
        address,
        name,
        city,
        citycode,
        latitude,
        longitude,
        populationTotal,
        populationCouples,
        populationMinors,
        electricityType,
        accessToWater,
        accessToSanitary,
        trashEvacuation,
        ownerComplaint,
        justiceProcedure,
        justiceRendered,
        justiceRenderedAt,
        justiceChallenged,
        fieldType,
        ownerType,
        declaredAt,
    } = await cleanParams(models, body, format);

    const now = Date.now();
    const fieldErrors = {};
    const error = addError.bind(this, fieldErrors);

    // priority
    if (priority !== null && (priority < 1 || priority > 3)) {
        error('priority', 'Le niveau de priorité doit être compris entre 1 et 3');
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
            dbCity = await models.geo.getLocation('city', citycode);
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

    if (permission.geographic_level !== 'nation') {
        switch (user.organization.location.type) {
            case 'nation':
                // OK
                break;

            case 'region':
            case 'departement':
            case 'epci':
            case 'city':
                if (user.organization.location[user.organization.location.type].code !== dbCity[user.organization.location.type].code) {
                    error('address', 'Vous n\'avez pas les droits d\'accès à ce territoire');
                }
                break;

            default:
                error('address', 'Votre niveau géographique est inconnu');
                break;
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

    // name
    if (name !== null && name.length > 35) {
        error('name', 'L\'appelation du site ne peut pas dépasser 35 caractères');
    }

    // field type
    if (fieldType === null) {
        error(toFormat('field_type', format), 'Le champ "type de site" est obligatoire');
    }

    // owner type && owner
    if (ownerType === null) {
        error(toFormat('owner_type', format), 'Le champ "type de propriétaire" est obligatoire');
    } else {
        const type = await models.ownerType.findOne(ownerType);
        if (type === null) {
            error(toFormat('owner_type', format), 'La valeur choisie pour "type de propriétaire" n\'a pas été retrouvée en base de données');
        }
    }

    // justice status
    if (permission.data_justice === true) {
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

    // access to sanitary
    if (accessToSanitary === null) {
        error(toFormat('access_to_sanitary', format), 'Le champ "Accès aux toilettes" est obligatoire');
    } else if ([-1, 0, 1].indexOf(accessToSanitary) === -1) {
        error(toFormat('access_to_sanitary', format), 'Valeur invalide');
    }

    // trash evacuatioon
    if (trashEvacuation === null) {
        error(toFormat('trash_evacuation', format), 'Le champ "Évacuation des déchets" est obligatoire');
    } else if ([-1, 0, 1].indexOf(trashEvacuation) === -1) {
        error(toFormat('trash_evacuation', format), 'Valeur invalide');
    }

    return fieldErrors;
};
