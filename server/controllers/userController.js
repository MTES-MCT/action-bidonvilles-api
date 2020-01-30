const validator = require('validator');
const semver = require('semver');
const jwt = require('jsonwebtoken');
const { sequelize } = require('#db/models');

const {
    generateAccessTokenFor, hashPassword, generateSalt, getAccountActivationLink,
    getPasswordResetLink,
} = require('#server/utils/auth');
const {
    send: sendMail,
} = require('#server/utils/mail');
const permissionsDescription = require('#server/permissions_description');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.new_user_confirmation = require('#server/mails/new_user_confirmation');
MAIL_TEMPLATES.new_user_alert = require('#server/mails/new_user_alert');
MAIL_TEMPLATES.access_granted = require('#server/mails/access_granted');
MAIL_TEMPLATES.access_denied = require('#server/mails/access_denied');
MAIL_TEMPLATES.new_password = require('#server/mails/new_password');

const { auth: authConfig } = require('#server/config');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

function checkPassword(str) {
    if (!str) {
        return ['Le mot de passe est obligatoire'];
    }

    const errors = [];
    if (str.length < 12) {
        errors.push('Le mot de passe doit comporter 12 caractères ou plus');
    }

    if (!(/[a-z]/g).test(str)) {
        errors.push('Le mot de passe doit comporter une lettre minuscule');
    }

    if (!(/[A-Z]/g).test(str)) {
        errors.push('Le mot de passe doit comporter une lettre majuscule');
    }

    if (!(/[^a-zA-Z]/g).test(str)) {
        errors.push('Le mot de passe doit comporter un caractère non alphabétique');
    }

    return errors;
}

function fromOptionToPermissions(option, dataJustice) {
    switch (option.id) {
        case 'close_shantytown':
            return [
                {
                    entity: 'shantytown',
                    feature: 'close',
                    level: 'local',
                    data: { data_justice: dataJustice },
                    allowed: true,
                },
            ];

        case 'create_and_close_shantytown':
            return [
                {
                    entity: 'shantytown',
                    feature: 'create',
                    level: 'local',
                    data: { data_justice: dataJustice },
                    allowed: true,
                },
                {
                    entity: 'shantytown',
                    feature: 'close',
                    level: 'local',
                    data: { data_justice: dataJustice },
                    allowed: true,
                },
            ];

        case 'hide_justice':
            return [
                {
                    entity: 'shantytown',
                    feature: 'list',
                    level: 'local',
                    data: { data_justice: false },
                    allowed: true,
                },
                {
                    entity: 'shantytown',
                    feature: 'read',
                    level: 'local',
                    data: { data_justice: false },
                    allowed: true,
                },
                {
                    entity: 'shantytown',
                    feature: 'export',
                    level: 'local',
                    data: { data_justice: false },
                    allowed: true,
                },
            ];

        default:
            return [];
    }
}

class MultipleError extends Error {
    constructor(messages, ...args) {
        super('Plusieurs erreurs sont survenues', ...args);
        this.messages = messages;
    }
}

function fromOptionsToPermissions(options) {
    if (options.length === 0) {
        return [];
    }

    // special case of data_justice
    const dataJustice = options.find(({ id }) => id === 'hide_justice') === null;

    return options.reduce((permissions, option) => [
        ...permissions,
        ...fromOptionToPermissions(option, dataJustice),
    ], []);
}

module.exports = (models) => {
    const sanitizers = {
        string(str) {
            return typeof str === 'string' ? validator.trim(str) : null;
        },

        bool(bool) {
            return typeof bool === 'boolean' ? bool : false;
        },

        integer(int) {
            const parsed = parseInt(int, 10);
            return Number.isInteger(parsed) ? parsed : null;
        },

        object(obj) {
            return typeof obj === 'object' ? obj : null;
        },
    };

    const validators = {
        last_name(data) {
            if (data.last_name === null || data.last_name === '') {
                throw new Error('Le nom est obligatoire');
            }
        },

        first_name(data) {
            if (data.first_name === null || data.first_name === '') {
                throw new Error('Le prénom est obligatoire');
            }
        },

        async email(data, checkUnicity = true) {
            if (data.email === null || data.email === '') {
                throw new Error('Le courriel est obligatoire');
            }

            if (!validator.isEmail(data.email)) {
                throw new Error('Le courriel est invalide');
            }

            if (checkUnicity === true) {
                let user = null;
                try {
                    user = await models.user.findOneByEmail(data.email);
                } catch (error) {
                    throw new Error('Une erreur est survenue lors de la vérification de votre courriel');
                }

                if (user !== null) {
                    throw new Error('Un utilisateur existe déjà pour ce courriel');
                }
            }
        },

        async organization_category(data) {
            if (data.organization_category === null) {
                throw new Error('La structure est obligatoire');
            }

            let category = null;
            try {
                category = await models.organizationCategory.findOneById(data.organization_category);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification de la structure sélectionnée');
            }

            if (category === null) {
                throw new Error('La structure sélectionnée n\'existe pas en base de données');
            }
        },

        position(data) {
            if (data.position === null || data.position === '') {
                throw new Error('La fonction est obligatoire');
            }
        },

        phone(data) {
            if (data.phone === null || data.phone === '') {
                return;
            }

            if (!/^0[0-9]{9}$/g.test(data.phone)) {
                throw new Error('Le téléphone doit être une suite de 10 chiffres');
            }
        },

        password(data) {
            if (data.password === null || data.password === '') {
                throw new Error('Le mot de passe est obligatoire');
            }

            const passwordErrors = checkPassword(data.password);
            if (passwordErrors.length > 0) {
                throw new MultipleError(passwordErrors);
            }
        },

        access_request_message(data) {
            if (data.access_request_message === null || data.access_request_message === '') {
                throw new Error('Le message est obligatoire');
            }
        },

        legal(data) {
            if (data.legal !== true) {
                throw new Error('Vous devez confirmer que les données saisies l\'ont été avec votre accord');
            }
        },

        async organization_type(data) {
            if (data.organization_type === null) {
                throw new Error('Le type de structure est obligatoire');
            }

            let type = null;
            try {
                type = await models.organizationType.findOneById(data.organization_type);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du type de structure sélectionné');
            }

            if (type === null) {
                throw new Error('Le type de structure sélectionné n\'existe pas en base de données');
            }

            if (type.organization_category !== data.organization_category) {
                throw new Error('La structure et le type de structure sélectionnés ne se correspondent pas');
            }
        },

        async organization_public(data) {
            if (data.organization_public === null) {
                throw new Error('Le territoire de rattachement est obligatoire');
            }

            let organization = null;
            try {
                organization = await models.organization.findOneById(data.organization_public);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du territoire de rattachement');
            }

            if (organization === null) {
                throw new Error('Le territoire de rattachement sélectionné n\'existe pas en base de données');
            }

            if (organization.fk_type !== data.organization_type) {
                throw new Error('Le territoire de rattachement sélectionné ne correspond à aucune structure en base de données');
            }

            Object.assign(data, { organization: organization.id });
        },

        async territorial_collectivity(data) {
            if (data.territorial_collectivity === null) {
                throw new Error('Le nom de la structure est obligatoire');
            }

            let organization = null;
            try {
                organization = await models.organization.findOneByLocation(
                    data.territorial_collectivity.category,
                    data.territorial_collectivity.data.type,
                    data.territorial_collectivity.data.code,
                );
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de la structure');
            }

            if (organization === null) {
                throw new Error('La structure sélectionnée n\'existe pas en base de données');
            }

            if (organization.fk_category !== data.organization_category) {
                throw new Error('La structure sélectionnée n’est pas une collectivité territoriale');
            }

            Object.assign(data, { organization: organization.id });
        },

        async organization_administration(data) {
            if (data.organization_administration === null) {
                throw new Error('Le nom de la structure est obligatoire');
            }

            let organization = null;
            try {
                organization = await models.organization.findOneById(data.organization_administration);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de la structure');
            }

            if (organization === null) {
                throw new Error('La structure sélectionnée n\'existe pas en base de données');
            }

            if (organization.fk_category !== data.organization_category) {
                throw new Error('La structure sélectionnée n’est pas une administration centrale');
            }

            Object.assign(data, { organization: organization.id });
        },

        async association(data) {
            if (data.association === null || data.association === '') {
                throw new Error('Le nom de la structure est obligatoire');
            }

            if (data.association === 'Autre') {
                return;
            }

            let association;
            try {
                association = await models.organization.findAssociationName(data.association);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom de l\'association');
            }

            if (association === null) {
                throw new Error('L\'association sélectionnée n\'a pas été trouvée en base de données');
            }
        },

        async newAssociationName(data) {
            if (data.association !== 'Autre') {
                return;
            }

            if (data.newAssociationName === null || data.newAssociationName === '') {
                throw new Error('Le nom complet de l\'association est obligatoire');
            }

            let association;
            try {
                association = await models.organization.findAssociationName(data.newAssociationName);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du nom complet de l\'association');
            }

            if (association !== null) {
                throw new Error('Il existe déjà une association enregistrée sous ce nom');
            }
        },

        newAssociationAbbreviation() { },

        async departement(data) {
            if (data.departement === null) {
                throw new Error('Le territoire de rattachement est obligatoire');
            }

            let departement;
            try {
                departement = await models.departement.findOne(data.departement);
            } catch (error) {
                throw new Error('Une erreur est survenue lors de la vérification du territoire de rattachement');
            }

            if (departement === null) {
                throw new Error('Le terrtoire de rattachement sélectionné n\'existe pas en base de données');
            }
        },
    };

    function sanitize(data, fields) {
        return fields.reduce((acc, { key, sanitizer }) => Object.assign(acc, {
            [key]: sanitizers[sanitizer](data[key]),
        }), {});
    }

    async function validate(data, fields) {
        const errors = {};

        for (let i = 0; i < fields.length; i += 1) {
            const { key, validatorOptions } = fields[i];

            try {
                // eslint-disable-next-line no-await-in-loop
                await validators[key].apply(validators, [data, ...(validatorOptions || [])]);
            } catch (error) {
                if (error instanceof MultipleError) {
                    errors[key] = error.messages;
                } else {
                    errors[key] = [error.message];
                }
            }
        }

        return errors;
    }

    async function validateCreationInput(req, extendedData = {}, extendedFields = []) {
        const rawData = Object.assign({
            last_name: req.body.last_name,
            first_name: req.body.first_name,
            email: req.body.email,
            organization_category: req.body.organization_category,
            position: req.body.position,
            legal: req.body.legal,
            organization_type: req.body.organization_type,
            organization_public: req.body.organization_public,
            territorial_collectivity: req.body.territorial_collectivity,
            association: req.body.association,
            newAssociationName: req.body.newAssociationName,
            newAssociationAbbreviation: req.body.newAssociationAbbreviation,
            departement: req.body.departement,
            organization_administration: req.body.organization_administration,
        }, extendedData);

        // get the list of fields to be validated
        const fields = [
            ...[
                { key: 'last_name', sanitizer: 'string' },
                { key: 'first_name', sanitizer: 'string' },
                { key: 'email', sanitizer: 'string' },
                { key: 'organization_category', sanitizer: 'string' },
                { key: 'position', sanitizer: 'string' },
                { key: 'legal', sanitizer: 'bool' },
            ],
            ...extendedFields,
        ];

        const specificFields = {
            public_establishment() {
                return [
                    { key: 'organization_type', sanitizer: 'integer' },
                    { key: 'organization_public', sanitizer: 'integer' },
                ];
            },

            territorial_collectivity() {
                return [
                    { key: 'territorial_collectivity', sanitizer: 'object' },
                ];
            },

            association() {
                return [
                    { key: 'association', sanitizer: 'string' },
                    { key: 'newAssociationName', sanitizer: 'string' },
                    { key: 'newAssociationAbbreviation', sanitizer: 'string' },
                    { key: 'departement', sanitizer: 'string' },
                ];
            },

            administration() {
                return [
                    { key: 'organization_administration', sanitizer: 'integer' },
                ];
            },
        };

        if (Object.prototype.hasOwnProperty.call(specificFields, req.body.organization_category)) {
            fields.push(...specificFields[req.body.organization_category]());
        }

        // sanitize
        const sanitizedData = sanitize(rawData, fields);

        // validate
        return {
            sanitizedData,
            errors: await validate(sanitizedData, fields),
        };
    }

    async function createUser(data) {
        const userId = await sequelize.transaction(async (t) => {
            // create association if necessary
            if (data.organization_category === 'association') {
                let create = null;
                let organization = null;
                if (data.association === 'Autre') {
                    create = {
                        name: data.newAssociationName,
                        abbreviation: data.newAssociationAbbreviation || null,
                    };
                } else {
                    organization = await models.organization.findOneAssociation(
                        data.association,
                        data.departement,
                    );

                    if (organization === null) {
                        const association = await models.organization.findAssociationName(data.association);

                        create = {
                            name: association !== null ? association.name : data.association,
                            abbreviation: association !== null ? association.abbreviation : null,
                        };
                    }
                }

                if (create !== null) {
                    const type = (await models.organizationType.findByCategory('association'))[0].id;
                    [[organization]] = (await models.organization.create(
                        create.name,
                        create.abbreviation,
                        type,
                        null,
                        data.departement,
                        null,
                        null,
                        false,
                        t,
                    ));
                }

                Object.assign(data, { organization: organization.id });
            }

            // create the user himself
            return models.user.create(Object.assign(data, {
                salt: generateSalt(),
            }), t);
        });

        return models.user.findOne(userId);
    }

    return {
        async list(req, res) {
            try {
                const users = await models.user.findAll(req.user);
                res.status(200).send(users);
            } catch (error) {
                res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la récupération des données en base',
                        developer_message: error.message,
                    },
                });
            }
        },

        async get(req, res) {
            try {
                const user = await models.user.findOne(req.params.id, { extended: true }, req.user);
                res.status(200).send(user);
            } catch (error) {
                res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la récupération des données en base',
                        developer_message: error.message,
                    },
                });
            }
        },

        async signin(req, res) {
            const { email, password } = req.body;

            if (typeof email !== 'string') {
                return res.status(400).send({
                    success: false,
                    error: {
                        user_message: 'Ces identifiants sont incorrects',
                        developer_message: 'The email address must be a string',
                        fields: {
                            email: ['L\'adresse e-mail est invalide'],
                        },
                    },
                });
            }

            if (typeof password !== 'string') {
                return res.status(400).send({
                    success: false,
                    error: {
                        user_message: 'Ces identifiants sont incorrects',
                        developer_message: 'The password must be a string',
                        fields: {
                            password: ['Le mot de passe est invalide'],
                        },
                    },
                });
            }

            const user = await models.user.findOneByEmail(email, {
                auth: true,
            });

            if (user === null) {
                return res.status(403).send({
                    success: false,
                    error: {
                        user_message: 'Ces identifiants sont incorrects',
                        developer_message: 'The given credentials do not match an existing user',
                    },
                });
            }

            if (user.status !== 'active') {
                return res.status(400).send({
                    success: false,
                    error: {
                        user_message: 'Votre compte doit être activé avant utilisation',
                        developer_message: 'The user is not activated yet',
                    },
                });
            }

            const hashedPassword = hashPassword(password, user.salt);
            if (hashedPassword !== user.password) {
                return res.status(403).send({
                    success: false,
                    error: {
                        user_message: 'Ces identifiants sont incorrects',
                        developer_message: 'The given credentials do not match an existing user',
                    },
                });
            }

            return res.status(200).send({
                success: true,
                token: generateAccessTokenFor(user),
            });
        },

        renewToken(req, res) {
            const { id: userId, email } = req.user;

            return res.status(200).send({
                token: generateAccessTokenFor({ id: userId, email }),
            });
        },

        /**
         * Returns information about... yourself!
         */
        async me(req, res) {
            const user = await models.user.findOne(req.user.id, {
                extended: true,
            });
            return res.status(200).send(user);
        },

        /**
         * Updates some data about the current user
         */
        async edit(req, res) {
            // find the user
            const { id: userId } = req.user;
            const user = await models.user.findOne(userId, { auth: true });

            if (user === null) {
                return res.status(500).send({
                    error: {
                        user_message: 'Impossible de trouver vos informations en bases de données.',
                        developer_message: `User #${userId} does not exist`,
                    },
                });
            }

            // validate the input
            const errors = {};

            // first name
            const firstName = trim(req.body.first_name);
            if (firstName === null || firstName === '') {
                errors.first_name = ['Le prénom est obligatoire '];
            }

            // last name
            const lastName = trim(req.body.last_name);
            if (lastName === null || lastName === '') {
                errors.last_name = ['Le nom de famille est obligatoire '];
            }

            // password
            if (req.body.password) {
                const passwordErrors = checkPassword(req.body.password);
                if (passwordErrors.length > 0) {
                    errors.password = passwordErrors;
                }
            }

            if (Object.keys(errors).length > 0) {
                return res.status(400).send({
                    error: {
                        developer_message: 'The submitted data contains errors',
                        user_message: 'Certaines données sont invalides',
                        fields: errors,
                    },
                });
            }

            // actually update the user
            const data = {
                first_name: firstName,
                last_name: lastName,
            };

            if (req.body.password) {
                data.password = hashPassword(req.body.password, user.salt);
            }

            try {
                await models.user.update(userId, data);
                return res.status(200).send({
                    id: user.userId,
                    email: user.email,
                    first_name: firstName,
                    last_name: lastName,
                    departement: user.departement,
                });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue dans l\'écriture de vos informations en base de données.',
                        developer_message: error.message,
                    },
                });
            }
        },

        async create(req, res) {
            // validate input
            const { sanitizedData, errors } = await validateCreationInput(req);

            if (Object.keys(errors).length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Certaines informations saisies sont incorrectes',
                        developer_message: 'Input data is invalid',
                        fields: errors,
                    },
                });
            }

            // insert user into database
            let user;
            try {
                user = await createUser(Object.assign({}, sanitizedData, {
                    access_request_message: null,
                    created_by: req.user.id,
                }));
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: 'Failed inserting the new user into database',
                    },
                });
            }

            // congratulations
            return res.status(200).send(user);
        },

        /**
         *
         */
        async signup(req, res) {
            // validate input
            const { sanitizedData, errors } = await validateCreationInput(
                req,
                {
                    access_request_message: req.body.access_request_message,
                },
                [
                    { key: 'access_request_message', sanitizer: 'string' },
                ],
            );

            if (Object.keys(errors).length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Certaines informations saisies sont incorrectes',
                        developer_message: 'Input data is invalid',
                        fields: errors,
                    },
                });
            }

            // insert user into database
            let simpleUser;
            try {
                simpleUser = await createUser(Object.assign({}, sanitizedData, {
                    created_by: null,
                }));
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: 'Failed inserting the new user into database',
                    },
                });
            }

            // send mails
            try {
                await sendMail(sanitizedData, MAIL_TEMPLATES.new_user_confirmation());
            } catch (error) {
                // ignore
            }

            try {
                const user = await models.user.findOne(simpleUser.id, { extended: true });
                const admins = await models.user.getAdminsFor(user);
                const mailTemplate = MAIL_TEMPLATES.new_user_alert(user, new Date());

                for (let i = 0; i < admins.length; i += 1) {
                    // eslint-disable-next-line no-await-in-loop
                    await sendMail(admins[i], mailTemplate);
                }
            } catch (error) {
                // ignore
            }

            // congratulations
            return res.status(200).send(simpleUser);
        },

        async setDefaultExport(req, res) {
            const { export: exportValue } = req.body;

            if (exportValue === undefined) {
                return res.status(400).send({
                    success: false,
                    error: {
                        user_message: 'Les nouvelles préférences d\'export sont manquantes',
                        developer_message: 'The new default export value is missing',
                    },
                });
            }

            try {
                await models.user.update(req.user.id, {
                    defaultExport: exportValue,
                });
            } catch (error) {
                return res.status(500).send({
                    success: false,
                    error: {
                        user_message: 'La sauvegarde de vos préférences a échoué',
                        developer_message: `Failed to store the new default-export into database: ${error.message}`,
                    },
                });
            }

            return res.status(200).send({
                success: true,
            });
        },

        async checkActivationToken(req, res) {
            if (!req.params.token) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation est manquant',
                        developer_message: 'The activation token is missing',
                    },
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(req.params.token, authConfig.secret);
            } catch (error) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation est invalide ou expiré.\nNous vous invitons à contacter l\'administrateur local qui vous a envoyé le mail avec ce lien d\'activation.',
                        developer_message: 'The activation token is either invalid or expired',
                    },
                });
            }

            const user = await models.user.findOne(decoded.userId);
            if (user === null) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation ne correspond à aucun utilisateur',
                        developer_message: 'The activation token does not match a real user',
                    },
                });
            }

            if (user.status !== 'new') {
                return res.status(400).send({
                    error: {
                        user_message: 'Ce compte utilisateur est déjà activé',
                        developer_message: 'The user is already activated',
                    },
                });
            }

            return res.status(200).send({
                id: user.id,
                email: user.email,
            });
        },

        async checkPasswordToken(req, res) {
            if (!req.params.token) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification est manquant',
                        developer_message: 'The password token is missing',
                    },
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(req.params.token, authConfig.secret);
            } catch (error) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification est invalide ou expiré.\nNous vous invitons à reprendre le formulaire de demande de renouvelement de mot de passe.',
                        developer_message: 'The password token is either invalid or expired',
                    },
                });
            }

            if (decoded.type !== 'password_reset') {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification est invalide',
                        developer_message: 'The given token is not a password token',
                    },
                });
            }

            const user = await models.user.findOne(decoded.userId);
            if (user === null) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification ne correspond à aucun utilisateur',
                        developer_message: 'The password token does not match a real user',
                    },
                });
            }

            return res.status(200).send({
                id: user.id,
                email: user.email,
            });
        },

        async sendActivationLink(req, res) {
            let user;
            try {
                user = await models.user.findOne(req.params.id, { extended: true }, req.user, 'activate');
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture en base de données',
                        developer_message: error.message,
                    },
                });
            }

            if (user === null) {
                return res.status(404).send({
                    error: {
                        user_message: 'L\'utilisateur auquel envoyer un accès n\'a pas été trouvé en base de données',
                        developer_message: null,
                    },
                });
            }

            if (user.activated_on !== null) {
                return res.status(400).send({
                    error: {
                        user_message: 'L\'utilisateur concerné a déjà été activé',
                        developer_message: null,
                    },
                });
            }

            if (user.organization.active !== true) {
                const { options } = permissionsDescription[user.role_id];
                const requestedOptions = options.filter(({ id }) => req.body.options && req.body.options[id] === true);

                // inject additional permissions related to options
                const additionalPermissions = fromOptionsToPermissions(requestedOptions);
                try {
                    await models.organization.setCustomPermissions(user.organization.id, additionalPermissions);
                } catch (error) {
                    return res.status(500).send({
                        error: {
                            user_message: 'Une erreur est survenue lors de la sauvegarde des options sélectionnées',
                            developer_message: error.message,
                        },
                    });
                }
            }

            const { link: activationLink, expiracyDate } = getAccountActivationLink({
                id: user.id,
                email: user.email,
                activatedBy: req.user.id,
            });

            try {
                // reload the user to take options into account (they might have changed above)
                user = await models.user.findOne(req.params.id, { extended: true }, req.user, 'activate');
                await sendMail(user, MAIL_TEMPLATES.access_granted(user, req.user, activationLink, expiracyDate), req.user);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'envoi du mail',
                        developer_message: error.message,
                    },
                });
            }

            try {
                await models.user.update(req.params.id, {
                    last_activation_link_sent_on: new Date(),
                });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: error.message,
                    },
                });
            }

            return res.status(200).send({});
        },

        async denyAccess(req, res) {
            let user;
            try {
                user = await models.user.findOne(req.params.id, undefined, req.user, 'activate');
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture en base de données',
                        developer_message: error.message,
                    },
                });
            }

            if (user === null) {
                return res.status(404).send({
                    error: {
                        user_message: 'L\'utilisateur auquel refuser l\'accès n\'a pas été trouvé en base de données',
                        developer_message: null,
                    },
                });
            }

            if (user.activated_on !== null) {
                return res.status(400).send({
                    error: {
                        user_message: 'L\'utilisateur concerné a déjà été activé',
                        developer_message: null,
                    },

                });
            }

            if (user.last_activation_link_sent_on !== null) {
                return res.status(400).send({
                    error: {
                        user_message: 'La demande d\'accès a déjà été acceptée',
                        developer_message: null,
                    },
                });
            }

            try {
                await sendMail(user, MAIL_TEMPLATES.access_denied(user, req.user), req.user);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'envoi du mail',
                        developer_message: error.message,
                    },
                });
            }

            try {
                await models.user.delete(req.params.id);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la suppression du compte de la base de données',
                        developer_message: error.message,
                    },
                });
            }

            return res.status(200).send({});
        },

        async activate(req, res) {
            if (!req.body.token) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation est manquant',
                        developer_message: 'The activation token is missing',
                    },
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(req.body.token, authConfig.secret);
            } catch (error) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation est invalide ou expiré',
                        developer_message: 'The activation token is either invalid or expired',
                    },
                });
            }

            const user = await models.user.findOne(decoded.userId, { auth: true });
            if (user === null) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation ne correspond à aucun utilisateur',
                        developer_message: 'The activation token does not match a real user',
                    },
                });
            }

            if (user.id !== parseInt(req.params.id, 10)) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'activation n\'est pas valide',
                        developer_message: 'The activation token does not match the user id',
                    },
                });
            }

            if (user.status === 'active') {
                return res.status(400).send({
                    error: {
                        user_message: 'Ce compte utilisateur est déjà activé',
                        developer_message: 'The user is already activated',
                    },
                });
            }

            const errors = checkPassword(req.body.password);
            if (errors.length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le mot de passe est invalide',
                        developer_message: 'Input data is invalid',
                        fields: {
                            password: errors,
                        },
                    },
                });
            }

            try {
                await models.organization.activate(user.organization.id);
                await models.user.update(user.id, {
                    password: hashPassword(req.body.password, user.salt),
                    fk_status: 'active',
                    activated_by: decoded.activatedBy,
                    activated_on: new Date(),
                });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: 'Failed updating the user',
                    },
                });
            }

            return res.status(200).send({});
        },

        async setNewPassword(req, res) {
            if (!req.body.token) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification est manquant',
                        developer_message: 'The password token is missing',
                    },
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(req.body.token, authConfig.secret);
            } catch (error) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification est invalide ou expiré',
                        developer_message: 'The password token is either invalid or expired',
                    },
                });
            }

            if (decoded.type !== 'password_reset') {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification n\'est pas valide',
                        developer_message: 'The password token does not match the user id',
                    },
                });
            }

            const user = await models.user.findOne(decoded.userId, { auth: true });
            if (user === null) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification ne correspond à aucun utilisateur',
                        developer_message: 'The password token does not match a real user',
                    },
                });
            }

            if (user.id !== parseInt(req.params.id, 10)) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le jeton d\'identification n\'est pas valide',
                        developer_message: 'The password token does not match the user id',
                    },
                });
            }

            const errors = checkPassword(req.body.password);
            if (errors.length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le mot de passe est invalide',
                        developer_message: 'Input data is invalid',
                        fields: {
                            password: errors,
                        },
                    },
                });
            }

            try {
                await models.user.update(user.id, {
                    password: hashPassword(req.body.password, user.salt),
                });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: 'Failed updating the user',
                    },
                });
            }

            return res.status(200).send({});
        },

        async upgrade(req, res) {
            // ensure the user exists and actually needs an upgrade
            let user;
            try {
                user = await models.user.findOne(req.params.id, { auth: true });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est surenue lors de la lecture de la base de données',
                        developer_message: error.message,
                    },
                });
            }

            if (user === null) {
                return res.status(404).send({
                    error: {
                        user_message: 'Votre compte n\'a pas été retrouvé en base de données',
                    },
                });
            }

            if (user.position !== '') {
                return res.status(400).send({
                    error: {
                        user_message: 'Votre compte est déjà à jour',
                    },
                });
            }

            // validate the input data
            const rawData = {
                position: req.body.position,
                phone: req.body.phone,
                password: req.body.password,
            };

            const fields = [
                { key: 'position', sanitizer: 'string' },
                { key: 'phone', sanitizer: 'string' },
                { key: 'password', sanitizer: 'string' },
            ];

            const sanitizedData = sanitize(rawData, fields);
            const errors = await validate(sanitizedData, fields);

            if (Object.keys(errors).length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Certaines informations saisies sont incorrectes',
                        developer_message: 'Input data is invalid',
                        fields: errors,
                    },
                });
            }

            try {
                await models.user.update(user.id, Object.assign({}, sanitizedData, {
                    password: hashPassword(sanitizedData.password, user.salt),
                }));
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: error.message,
                    },
                });
            }

            return res.status(200).send({});
        },

        async remove(req, res) {
            let user;
            try {
                user = await models.user.findOne(req.params.id, undefined, req.user, 'deactivate');
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture en base de données',
                        developer_message: error.message,
                    },
                });
            }

            if (user === null) {
                return res.status(404).send({
                    error: {
                        user_message: 'L\'utilisateur auquel supprimer l\'accès n\'a pas été trouvé en base de données',
                        developer_message: null,
                    },
                });
            }

            try {
                await models.user.deactivate(req.params.id);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la suppression du compte de la base de données',
                        developer_message: error.message,
                    },
                });
            }

            return res.status(200).send({});
        },

        async requestNewPassword(req, res) {
            const data = { email: req.body.email };
            const fields = [
                { key: 'email', sanitizer: 'string', validatorOptions: [false] },
            ];
            const sanitizedData = sanitize(data, fields);

            const errors = await validate(sanitizedData, fields);
            if (Object.keys(errors).length > 0) {
                return res.status(400).send({
                    error: {
                        user_message: 'Certaines données sont manquantes ou invalides',
                        fields: errors,
                    },
                });
            }

            let user;
            try {
                user = await models.user.findOneByEmail(sanitizedData.email);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture en base de données',
                        developer_messaage: error.message,
                    },
                });
            }

            if (user !== null) {
                try {
                    const resetLink = getPasswordResetLink(user);
                    await sendMail(user, MAIL_TEMPLATES.new_password(user, resetLink));
                } catch (error) {
                    return res.status(500).send({
                        error: {
                            user_message: 'Une erreur est survenue lors de l\'envoi du mail',
                            developer_message: error.message,
                        },
                    });
                }
            }

            return res.status(200).send({});
        },

        async setLastChangelog(req, res) {
            const changelog = semver.valid(req.body.version);
            if (changelog === null) {
                return res.status(400).send({
                    error: {
                        user_message: 'Le numéro de version passé en paramètre est invalide',
                    },
                });
            }

            if (req.user.last_changelog !== null && semver.gte(req.user.last_changelog, changelog)) {
                return res.status(200).send({});
            }

            try {
                await models.user.update(req.user.id, {
                    last_changelog: changelog,
                });
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                    },
                });
            }

            return res.status(200).send({});
        },
    };
};
