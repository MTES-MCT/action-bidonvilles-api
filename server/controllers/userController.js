const semver = require('semver');
const jwt = require('jsonwebtoken');
const sanitize = require('#server/controllers/userController/helpers/sanitize');
const checkPassword = require('#server/controllers/userController/helpers/checkPassword');
const validate = require('#server/controllers/userController/helpers/validate');
const userService = require('#server/services/userService');

const {
    generateAccessTokenFor, hashPassword, getAccountActivationLink, getPasswordResetLink,
} = require('#server/utils/auth');
const {
    send: sendMail,
} = require('#server/utils/mail');
const permissionsDescription = require('#server/permissions_description');

const MAIL_TEMPLATES = {};
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

function fromOptionToPermissions(user, option, dataJustice) {
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

        case 'hide_justice': {
            const defaultPermissions = user.permissions.shantytown || {};

            return Object.keys(defaultPermissions).map(feature => ({
                entity: 'shantytown',
                feature,
                level: defaultPermissions[feature].geographic_level,
                data: { data_justice: false },
                allowed: defaultPermissions[feature].allowed,
            }));
        }

        default:
            return [];
    }
}

function fromOptionsToPermissions(user, options) {
    if (options.length === 0) {
        return [];
    }

    // special case of data_justice
    const dataJustice = options.find(({ id }) => id === 'hide_justice') === undefined;

    return options.reduce((permissions, option) => [
        ...permissions,
        ...fromOptionToPermissions(user, option, dataJustice),
    ], []);
}

module.exports = models => ({
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
        // create the user
        const result = await userService.create(
            {
                last_name: req.body.last_name,
                first_name: req.body.first_name,
                email: req.body.email,
                organization: req.body.organization_full ? req.body.organization_full.id : null,
                new_association: req.body.new_association === true,
                new_association_name: req.body.new_association_name || null,
                new_association_abbreviation: req.body.new_association_abbreviation || null,
                departement: req.body.departement || null,
                position: req.body.position,
                access_request_message: null,
            },
            req.user.id,
        );

        if (result.error) {
            return res.status(result.error.code).send(result.error.response);
        }

        return res.status(200).send(result);
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
            const additionalPermissions = fromOptionsToPermissions(user, requestedOptions);
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

    async acceptCharte(req, res) {
        if (parseInt(req.params.id, 10) !== req.user.id) {
            return res.status(400).send({
                user_message: 'Vous ne pouvez pas accepter la charte pour un autre utilisateur que vous-même',
            });
        }

        const charte = await models.charteEngagement.getLatest();
        if (charte === null) {
            return res.status(400).send({
                user_message: 'Il n\'y a aucune charte à accepter pour le moment',
            });
        }

        if (req.body.version_de_charte !== charte.version) {
            return res.status(400).send({
                user_message: 'Une charte plus récente existe, vous devez accepter la charte la plus récente',
            });
        }

        if (req.user.charte_engagement_a_jour !== true) {
            try {
                await models.user.update(req.user.id, {
                    charte_engagement_signee: req.body.version_de_charte,
                });
            } catch (error) {
                return res.status(500).send({
                    user_message: 'Une erreur est survenue lors de la mise à jour de la base de données',
                    developer_message: error.message,
                });
            }
        }

        return res.status(200).send({});
    },
});
