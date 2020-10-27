/* eslint-disable newline-per-chained-call */
const { body } = require('express-validator');
const { isLatLong, trim } = require('validator');

// models
const { sequelize } = require('#db/models');
const fieldTypeModel = require('#server/models/fieldTypeModel')(sequelize);
const geoModel = require('#server/models/geoModel')(sequelize);
const ownerTypeModel = require('#server/models/ownerTypeModel')(sequelize);
const socialOriginModel = require('#server/models/socialOriginModel')(sequelize);
const electricityTypeModel = require('#server/models/electricityTypeModel')(sequelize);

function fromIntToBoolSanitizer(value) {
    if (value === -1) {
        return null;
    }

    return value === 1;
}

module.exports = mode => ([
    /* **********************************************************************************************
     * Localisation géographique
     ********************************************************************************************* */
    body('address')
        // adresse
        .custom(async (value, { req }) => {
            if (value === undefined || value === null) {
                throw new Error('Le champ "Localisation géographique" est obligatoire');
            }

            if (typeof value !== 'string') {
                throw new Error('Le champ "Localisation géographique" est invalide');
            }

            const trimmed = trim(value);
            if (trimmed === '') {
                throw new Error('Le champ "Localisation géographique" est obligatoire');
            }

            req.body.address = trimmed;
            return true;
        })
        // ville
        .custom(async (value, { req }) => {
            if (req.body.citycode === undefined || req.body.citycode === null) {
                throw new Error('Le code communal est obligatoire');
            }

            if (typeof req.body.citycode !== 'string') {
                throw new Error('Le code communal est invalide');
            }

            let city;
            try {
                city = await geoModel.getLocation('city', req.body.citycode);
            } catch (e) {
                throw new Error('Une erreur de lecture en base de données est survenue lors de la validation du code communal');
            }

            if (city === null) {
                throw new Error('Le code communal ne correspond à aucune commune référencée en base de données');
            }

            req.body.city = city;
            return true;
        })
        // permissions d'écriture
        .custom((value, { req }) => {
            if (!req.body.city) {
                return true;
            }

            const permission = req.user.permissions.shantytown[mode];
            if (permission.geographic_level === 'nation') {
                return true;
            }

            const wording = mode === 'create' ? 'déclarer' : 'modifier';
            switch (req.user.organization.location.type) {
                case 'nation':
                    return true;

                case 'region':
                case 'departement':
                case 'epci':
                case 'city':
                    if (req.user.organization.location[req.user.organization.location.type].code !== req.body.city[req.user.organization.location.type].code) {
                        throw new Error(`Vous n'avez pas le droit de ${wording} un site sur ce territoire`);
                    }

                    return true;

                default:
                    throw new Error(`Imposible de valider que vous disposez des droits suffisants pour ${wording} un site`);
            }
        })
        // coordonnées GPS
        .custom((value, { req }) => {
            if (!req.body.coordinates) {
                throw new Error('Les coordonnées GPS sont obligatoires');
            }

            if (!isLatLong(req.body.coordinates)) {
                throw new Error('Les coordonnées GPS sont invalides');
            }

            const [latitude, longitude] = req.body.coordinates.split(',');
            req.body.latitude = parseFloat(latitude);
            req.body.longitude = parseFloat(longitude);

            return true;
        }),

    /* **********************************************************************************************
     * Appellation du site
     ********************************************************************************************* */
    body('name')
        .optional({ nullable: true })
        .isString().bail().withMessage('Le champ "Appellation du site" est invalide')
        .trim()
        .isLength({ max: 35 }).bail().withMessage('Le champ "Appellation du site" ne peut excéder 35 caractères'),

    body('name')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Information d'accès
     ********************************************************************************************* */
    body('detailed_address')
        .optional({ nullable: true })
        .isString().bail().withMessage('Le champ "Information d\'accès" est invalide')
        .trim(),

    body('detailed_address')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Niveau de priorité du site
     ********************************************************************************************* */
    body('priority')
        .optional({ nullable: true })
        .toInt()
        .isInt().bail().withMessage('Le champ "Niveau de priorité du site" est invalide')
        .isInt({ min: 1, max: 3 }).withMessage('La valeur du champ "Niveau de priorité du site" doit être comprise entre 1 et 3'),

    body('priority')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Date d'installation du site
     ********************************************************************************************* */
    body('built_at')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Date d\'installation du site" est obligatoire')
        .isDate().bail().withMessage('Le champ "Date d\'installation du site" est invalide')
        .toDate()
        .custom((value) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (value > today) {
                throw new Error('La date d\'installation du site ne peut pas être future');
            }

            return true;
        }),

    /* **********************************************************************************************
     * Date de signalement du site
     ********************************************************************************************* */
    body('declared_at')
        .optional({ nullable: true })
        .isDate().bail().withMessage('Le champ "Date de signalement du site" est invalide')
        .toDate()
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (value > today) {
                throw new Error('La date de signalement du site ne peut pas être future');
            }

            if (value < req.body.built_at) {
                throw new Error('La date de signalement du site ne peut pas être antérieure à la date d\'installation');
            }

            return true;
        }),

    body('declared_at')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Type de site
     ********************************************************************************************* */
    body('field_type')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Type de site" est obligatoire')
        .toInt()
        .isInt().bail().withMessage('Le champ "Type de site" est invalide')
        .custom(async (value, { req }) => {
            let fieldType;
            try {
                fieldType = await fieldTypeModel.findOne(value);
            } catch (error) {
                throw new Error('Une erreur de lecture en base de données est survenue lors de la validation du champ "Type de site"');
            }

            if (fieldType === null) {
                throw new Error('Le type de site sélectionné n\'existe pas en base de données');
            }

            req.body.field_type_full = fieldType;
            return true;
        }),

    /* **********************************************************************************************
     * Type de propriétaire
     ********************************************************************************************* */
    body('owner_type')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Type de propriétaire" est obligatoire')
        .toInt()
        .isInt().bail().withMessage('Le champ "Type de propriétaire" est invalide')
        .custom(async (value, { req }) => {
            let ownerType;
            try {
                ownerType = await ownerTypeModel.findOne(value);
            } catch (error) {
                throw new Error('Une erreur de lecture en base de données est survenue lors de la validation du champ "Type de propriétaire"');
            }

            if (ownerType === null) {
                throw new Error('Le type de propriétaire sélectionné n\'existe pas en base de données');
            }

            req.body.owner_type_full = ownerType;
            return true;
        }),

    /* **********************************************************************************************
     * Identité du propriétaire
     ********************************************************************************************* */
    body('owner')
        .customSanitizer((value, { req }) => {
            if (!req.body.owner_type_full || req.body.owner_type_full.label === 'Inconnu') {
                return null;
            }

            return value;
        })
        .optional({ nullable: true })
        .if((value, { req }) => req.body.owner_type_full && req.body.owner_type_full.label !== 'Inconnu')
        .isString().bail().withMessage('Le champ "Identité du propriétaire" est invalide')
        .trim(),

    body('owner')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Statut du diagnostic social
     ********************************************************************************************* */
    body('census_status')
        .optional({ nullable: true })
        .isIn(['none', 'scheduled', 'done']).withMessage('Le champ "Statut du diagnostic social" est invalide'),

    body('census_status')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Date du diagnostic
     ********************************************************************************************* */
    body('census_conducted_at')
        .customSanitizer((value, { req }) => {
            if (!['scheduled', 'done'].includes(req.body.census_status)) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => ['scheduled', 'done'].includes(req.body.census_status))
        .exists({ checkNull: true }).bail().withMessage('Le champ "Date du diagnostic" est obligatoire')
        .isDate().bail().withMessage('Le champ "Date du diagnostic" est invalide')
        .toDate()
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (req.body.built_at && value < req.body.built_at) {
                throw new Error('La date du diagnostic ne peut être antérieure à celle d\'installation du site');
            }

            if (req.body.census_status === 'scheduled') {
                if (value < today) {
                    throw new Error('La date d\'un diagnostic prévu ne peut être passée');
                }
            } else if (value > today) {
                throw new Error('La date d\'un diagnostic réalisé ne peut être future');
            }

            return true;
        }),

    /* **********************************************************************************************
     * Service ou opérateur en charge du diagnostic
     ********************************************************************************************* */
    body('census_conducted_by')
        .customSanitizer((value, { req }) => {
            if (!['scheduled', 'done'].includes(req.body.census_status)) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => ['scheduled', 'done'].includes(req.body.census_status))
        .exists({ checkNull: true }).bail().withMessage('Le champ "Service ou opérateur en charge du diagnostic" est obligatoire')
        .isString().bail().withMessage('Le champ "Service ou opérateur en charge du diagnostic" est invalide')
        .trim()
        .notEmpty().withMessage('Le champ "Service ou opérateur en charge du diagnostic" est obligatoire'),

    /* **********************************************************************************************
     * Nombre de personnes
     ********************************************************************************************* */
    body('population_total')
        .optional({ nullable: true })
        .toInt()
        .isInt().bail().withMessage('Le champ "Nombre de personnes" est invalide')
        .isInt({ min: 1 }).withMessage('Le champ "Nombre de personnes" ne peut pas être inférieur à 1'),

    body('population_total')
        .customSanitizer(value => (Number.isInteger(value) ? value : null)),

    /* **********************************************************************************************
     * Nombre de ménages
     ********************************************************************************************* */
    body('population_couples')
        .optional({ nullable: true })
        .toInt()
        .isInt().bail().withMessage('Le champ "Nombre de ménages" est invalide')
        .isInt({ min: 1 }).withMessage('Le champ "Nombre de ménages" ne peut pas être inférieur à 1')
        .custom((value, { req }) => {
            if (!Number.isInteger(req.body.population_total)) {
                return true;
            }

            if (value > req.body.population_total) {
                throw new Error('Le champ "Nombre de ménages" ne peut pas être supérieur au champ "Nombre de personnes"');
            }

            return true;
        }),

    body('population_couples')
        .customSanitizer(value => (Number.isInteger(value) ? value : null)),

    /* **********************************************************************************************
     * Nombre de mineurs
     ********************************************************************************************* */
    body('population_minors')
        .optional({ nullable: true })
        .toInt()
        .isInt().bail().withMessage('Le champ "Nombre de mineurs" est invalide')
        .isInt({ min: 0 }).withMessage('Le champ "Nombre de mineurs" ne peut pas être inférieur à 0')
        .custom((value, { req }) => {
            if (!Number.isInteger(req.body.population_total)) {
                return true;
            }

            if (value > req.body.population_total) {
                throw new Error('Le champ "Nombre de mineurs" ne peut pas être supérieur au champ "Nombre de personnes"');
            }

            return true;
        }),

    body('population_minors')
        .customSanitizer(value => (Number.isInteger(value) ? value : null)),

    /* **********************************************************************************************
     * Origines
     ********************************************************************************************* */
    body('social_origins')
        .customSanitizer((value) => {
            if (value === undefined || value === null) {
                return [];
            }

            return value;
        })
        .isArray().bail().withMessage('Le champ "Origines" est invalide')
        .custom(async (value, { req }) => {
            let socialOrigins = [];
            if (value.length > 0) {
                try {
                    socialOrigins = await socialOriginModel.find(value);
                } catch (error) {
                    throw new Error('Une erreur de lecture en base de données est survenue lors de la validation du champ "Origines"');
                }

                if (socialOrigins.length !== value.length) {
                    throw new Error('Certaines origines sélectionnées n\'existent pas en base de données');
                }
            }

            req.body.social_origins_full = socialOrigins;
            return true;
        }),

    /* **********************************************************************************************
     * Accès à l'électricité
     ********************************************************************************************* */
    body('electricity_type')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Accès à l\'électricité" est obligatoire')
        .toInt()
        .isInt().bail().withMessage('Le champ "Accès à l\'électricité" est invalide')
        .custom(async (value, { req }) => {
            let electricityType;
            try {
                electricityType = await electricityTypeModel.findOne(value);
            } catch (error) {
                throw new Error(
                    'Une erreur de lecture en base de données est survenue lors de la validation du champ "Accès à l\'électricité"',
                );
            }

            if (electricityType === null) {
                throw new Error(
                    'L\'accès à l\'électricité sélectionné n\'existe pas en base de données',
                );
            }

            req.body.electricity_type_full = electricityType;
            return true;
        }),

    /* **********************************************************************************************
     * Modalités d'accès (à l'électricité)
     ********************************************************************************************* */
    body('electricity_comments')
        .optional({ nullable: true })
        .isString().bail().withMessage('Le champ "Modalités d\'accès à l\'électricité" est invalide')
        .trim(),

    body('electricity_comments')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Accès à l'eau
     ********************************************************************************************* */
    body('access_to_water')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Accès à l\'eau" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Accès à l\'eau" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Modalités d'accès (à l'eau)
     ********************************************************************************************* */
    body('water_comments')
        .optional({ nullable: true })
        .isString().bail().withMessage('Le champ "Modalités d\'accès à l\'eau" est invalide')
        .trim(),

    body('water_comments')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Accès à des toilettes
     ********************************************************************************************* */
    body('access_to_sanitary')
        .exists({ checkNull: true }).bail().withMessage('La champ "Accès à des toilettes" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Accès à des toilettes" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Modalités d'accès (aux toilettes)
     ********************************************************************************************* */
    body('sanitary_comments')
        .optional({ nullable: true })
        .isString().bail().withMessage('Le champ "Modalités d\'accès aux toilettes" est invalide')
        .trim(),

    body('sanitary_comments')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Évacuation des déchets
     ********************************************************************************************* */
    body('trash_evacuation')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Évacuation des déchets" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Évacuation des déchets" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Dépôt de plainte par le propriétaire
     ********************************************************************************************* */
    body('owner_complaint')
        .customSanitizer((value, { req }) => {
            if (req.user.permissions.shantytown[mode].data_justice !== true) {
                return null;
            }

            return value;
        })
        .optional({ nullable: true })
        .if((value, { req }) => req.user.permissions.shantytown[mode].data_justice === true)
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Dépôt de plainte par le propriétaire" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Existence d'une procédure judiciaire
     ********************************************************************************************* */
    body('justice_procedure')
        .customSanitizer((value, { req }) => {
            if (req.user.permissions.shantytown[mode].data_justice !== true) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.user.permissions.shantytown[mode].data_justice === true)
        .exists({ checkNull: true }).bail().withMessage('Le champ "Existence d\'une procédure judiciaire" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Existence d\'une procédure judiciaire" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Décision de justice rendue
     ********************************************************************************************* */
    body('justice_rendered')
        .customSanitizer((value, { req }) => {
            if (req.body.justice_procedure !== true) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.body.justice_procedure === true)
        .exists({ checkNull: true }).bail().withMessage('Le champ "Décision de justice rendue" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Décision de justice rendue" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Origine de la décision
     ********************************************************************************************* */
    body('justice_rendered_by')
        .customSanitizer((value, { req }) => {
            if (req.body.justice_rendered !== true) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.body.justice_rendered === true)
        .exists({ checkNull: true }).bail().withMessage('Le champ "Origine de la décision" est obligatoire')
        .isString().bail().withMessage('Le champ "Origine de la décision" est invalide')
        .trim()
        .notEmpty().withMessage('Le champ "Origine de la décision" est obligatoire'),

    /* **********************************************************************************************
     * Date de la décision
     ********************************************************************************************* */
    body('justice_rendered_at')
        .customSanitizer((value, { req }) => {
            if (req.body.justice_rendered !== true) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.body.justice_rendered === true)
        .exists({ checkNull: true }).bail().withMessage('Le champ "Date de la décision" est obligatoire')
        .isDate().bail().withMessage('Le champ "Date de la décision" est invalide')
        .toDate()
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (value > today) {
                throw new Error('La date de la décision ne peut être future');
            }

            if (req.body.built_at && value < req.body.built_at) {
                throw new Error('La date de la décision ne peut être antérieure à celle d\'installation');
            }

            return true;
        }),

    /* **********************************************************************************************
     * Contentieux relatif à la décision de justice
     ********************************************************************************************* */
    body('justice_challenged')
        .customSanitizer((value, { req }) => {
            if (req.body.justice_rendered !== true) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.body.justice_rendered === true)
        .exists({ checkNull: true }).bail().withMessage('Le champ "Contentieux relatif à la décision de justice" est obligatoire')
        .toInt()
        .isInt({ min: -1, max: 1 }).withMessage('Le champ "Contentieux relatif à la décision de justice" est invalide')
        .customSanitizer(fromIntToBoolSanitizer),

    /* **********************************************************************************************
     * Concours de la force publique
     ********************************************************************************************* */
    body('police_status')
        .optional({ nullable: true })
        .isIn(['none', 'requested', 'granted']).withMessage('Le champ "Concours de la force publique" est invalide'),

    body('police_status')
        .customSanitizer(value => value || null),

    /* **********************************************************************************************
     * Date de la demande du CFP
     ********************************************************************************************* */
    body('police_requested_at')
        .customSanitizer((value, { req }) => {
            if (!['requested', 'granted'].includes(req.body.police_status)) {
                return null;
            }

            return value;
        })
        .if((value, { req }) => ['requested', 'granted'].includes(req.body.police_status))
        .exists({ checkNull: true }).bail().withMessage('Le champ "Date de la demande du CFP" est obligatoire')
        .isDate().bail().withMessage('Le champ "Date de la demande du CFP" est invalide')
        .toDate()
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (value > today) {
                throw new Error('La date de la demande du CFP ne peut être future');
            }

            if (req.body.built_at && value < req.body.built_at) {
                throw new Error('La date de la demande du CFP ne peut être antérieure à celle d\'installation');
            }

            return true;
        }),

    /* **********************************************************************************************
     * Date d'octroi du CFP
     ********************************************************************************************* */
    body('police_granted_at')
        .customSanitizer((value, { req }) => {
            if (req.body.police_status !== 'granted') {
                return null;
            }

            return value;
        })
        .if((value, { req }) => req.body.police_status === 'granted')
        .exists({ checkNull: true }).bail().withMessage('Le champ "Date d\'octroi du CFP" est obligatoire')
        .isDate().bail().withMessage('Le champ "Date d\'octroi du CFP" est invalide')
        .toDate()
        .custom((value, { req }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (value > today) {
                throw new Error('La date d\'octroi du CFP ne peut être future');
            }

            if (req.body.built_at && value < req.body.built_at) {
                throw new Error('La date d\'octroi du CFP ne peut être antérieure à celle d\'installation');
            }

            if (req.body.police_requested_at && value < req.body.police_requested_at) {
                throw new Error('La date d\'octroi du CFP ne peut être antérieur à la date de demande');
            }

            return true;
        }),

    /* **********************************************************************************************
     * Nom de l'étude d'huissiers
     ********************************************************************************************* */
    body('bailiff')
        .optional({ nullable: true })
        .isString().withMessage('Le champ "Nom de l\'étude d\'huissiers" est invalide')
        .trim(),

    body('bailiff')
        .customSanitizer(value => value || null),
]);
