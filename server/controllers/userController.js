const {
    generateAccessTokenFor, hashPassword, generateSalt, getAccountActivationLink,
} = require('#server/utils/auth');
const jwt = require('jsonwebtoken');
const { auth: authConfig } = require('#server/config');
const { User } = require('#db/models');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = models => ({
    async list(req, res) {
        try {
            const users = await models.user.findAll();
            res.status(200).send(users.map(({
                id, email, departement, first_name, last_name, company, active,
            }) => ({
                id,
                email,
                departement,
                first_name,
                last_name,
                company,
                active,
            })));
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
                    user_message: 'L\'adresse e-mail est invalide',
                    developer_message: 'The email address must be a string',
                },
            });
        }

        if (typeof password !== 'string') {
            return res.status(400).send({
                success: false,
                error: {
                    user_message: 'Le mot de passe est invalide',
                    developer_message: 'The password must be a string',
                },
            });
        }

        const user = await models.user.findOneByEmail(email, true);

        if (user === null) {
            return res.status(403).send({
                success: false,
                error: {
                    user_message: 'Ces identifiants sont incorrects',
                    developer_message: 'The given credentials do not match an existing user',
                },
            });
        }

        if (user.active !== true) {
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
        return res.status(200).send(req.user);
    },

    /**
     * Updates some data about the current user
     */
    async edit(req, res) {
        // find the user
        const { id: userId } = req.user;
        const user = await User.findOne({
            where: {
                id: userId,
            },
        });

        if (user === null) {
            return res.status(500).send({
                error: {
                    user_message: 'Impossible de trouver voos informations en bases de données.',
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

        // company
        const company = trim(req.body.company);
        if (company === null || company === '') {
            errors.company = ['Le nom de la structure pour laquelle vous travaillez est obligatoire '];
        }

        // password
        const password = trim(req.body.password);
        if (password !== null && password.length < 10) {
            errors.password = ['Votre mot de passe n\'est pas assez long, il doit contenir au moins 10 caractères'];
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
            company,
        };

        if (password !== null) {
            data.password = hashPassword(password, user.salt);
        }

        try {
            await user.update(data);
            return res.status(200).send({
                id: user.userId,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                company,
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

    /**
     *
     */
    async create(req, res) {
        // create the new user
        const {
            email: rawEmail,
            departement: departementCode,
            firstName: rawFirstName,
            lastName: rawLastName,
            company: rawCompany,
            role: roleId,
            dataOwnerAgreement,
        } = req.body;

        const errors = {};
        function addError(fieldName, error) {
            if (!errors[fieldName]) {
                errors[fieldName] = [];
            }

            errors[fieldName].push(error);
        }

        // validate email
        const email = trim(rawEmail);
        if (!rawEmail || email === '') {
            addError('email', 'L\'adresse e-mail est obligatoire');
        } else {
            let user;
            try {
                user = await models.user.findOneByEmail(email);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture de la base de données',
                        developer_message: 'Failed checking email\'s unicity',
                    },
                });
            }

            if (user !== null) {
                addError('email', 'Cette adresse e-mail est déjà utilisée');
            }
        }

        const firstName = trim(rawFirstName);
        if (!rawFirstName || firstName === '') {
            addError('firstName', 'Le prénom est obligatoire');
        }

        const lastName = trim(rawLastName);
        if (!rawLastName || lastName === '') {
            addError('lastName', 'Le nom de famille est obligatoire');
        }

        const company = trim(rawCompany);
        if (!rawCompany || company === '') {
            addError('company', 'La structure est obligatoire');
        }

        if (!departementCode) {
            addError('departement', 'Le département est obligatoire');
        } else {
            let departement;
            try {
                departement = await models.departement.findOne(departementCode);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture de la base de données',
                        developer_message: 'Failed checking departement\'s existence',
                    },
                });
            }

            if (departement === null) {
                addError('departement', 'Ce département n\'est pas reconnu');
            }
        }

        if (!roleId) {
            addError('role', 'Le rôle est obligatoire');
        } else {
            let role;
            try {
                role = await models.role.findOne(roleId);
            } catch (error) {
                return res.status(500).send({
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture de la base de données',
                        developer_message: 'Failed checking role\'s existence',
                    },
                });
            }

            if (role === null) {
                addError('role', 'Ce rôle n\'existe pas');
            }
        }

        if (dataOwnerAgreement === undefined) {
            addError('dataOwnerAgreement', 'L\'accord du propriétaire des données doit être confirmée');
        } else if (dataOwnerAgreement !== true) {
            addError('dataOwnerAgreement', 'L\'accord du propriétaire des données est obligatoire');
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).send({
                error: {
                    user_message: 'Certaines informations saisies sont incorrectes',
                    developer_message: 'Input data is invalid',
                    fields: errors,
                },
            });
        }

        let userId;
        try {
            userId = await models.user.create({
                email,
                departement: departementCode,
                firstName,
                lastName,
                company,
                role: roleId,
                salt: generateSalt(),
                password: null,
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                    developer_message: 'Failed inserting the new user into database',
                },
            });
        }

        const activationLink = getAccountActivationLink({
            id: userId,
            email,
        });

        return res.status(200).send({
            activationLink,
        });
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

    async getActivationLink(req, res) {
        let user;
        try {
            user = await models.user.findOne(req.params.id);
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la lecture de la base de données',
                    developer_message: 'Failed retrieving the user from database',
                },
            });
        }

        if (user === null) {
            return res.status(404).send({
                error: {
                    user_message: 'L\'utilisateur à activer n\'existe pas',
                    developer_message: 'The user to be activated does not exist',
                },
            });
        }

        if (user.active === true) {
            return res.status(403).send({
                error: {
                    user_message: 'Cet utilisateur est déjà activé',
                    developer_message: 'The user is already activates',
                },
            });
        }

        const activationLink = getAccountActivationLink({
            id: user.id,
            email: user.email,
        });

        return res.status(200).send({
            activationLink,
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
                    user_message: 'Le jeton d\'activation est invalide ou expiré',
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

        if (user.active === true) {
            return res.status(400).send({
                error: {
                    user_message: 'Ce compte utilisateur est déjà activé',
                    developer_message: 'The user is already activated',
                },
            });
        }

        return res.status(200).send({
            userId: user.id,
        });
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

        const user = await models.user.findOne(decoded.userId, true);
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

        if (user.active === true) {
            return res.status(400).send({
                error: {
                    user_message: 'Ce compte utilisateur est déjà activé',
                    developer_message: 'The user is already activated',
                },
            });
        }

        if (!req.body.password) {
            return res.status(400).send({
                error: {
                    user_message: 'Le mot de passe est obligatoire',
                    developer_message: 'Input data is invalid',
                },
            });
        }

        try {
            await models.user.update(user.id, {
                password: hashPassword(req.body.password, user.salt),
                active: true,
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
});
