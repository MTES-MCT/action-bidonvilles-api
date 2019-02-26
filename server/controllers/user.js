const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { secret } = require('../config');
const { User } = require('../../db/models');

/**
 * Generates a new token
 *
 * @param {Object} content
 *
 * @returns {string}
 */
function generateToken(content) {
    return jwt.sign(content, secret, { expiresIn: '168h' });
}

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = {
    async signin(req, res) {
        const { email, password } = req.body;

        // ensure a user exists with that email
        const user = await User.findOne({
            where: {
                email,
            },
        });

        if (user === null) {
            return res.status(400).send({
                error: {
                    user_message: 'Les identifiants sont incorrects',
                },
            });
        }

        // ensure the password is correct
        const hash = crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex');
        if (hash !== user.password) {
            return res.status(400).send({
                error: {
                    user_message: 'Les identifiants sont incorrects',
                },
            });
        }

        // congratulations
        return res.status(200).send({
            token: generateToken({ userId: user.id, email }),
        });
    },

    renewToken(req, res) {
        const { userId, email } = req.decoded;

        return res.status(200).send({
            token: generateToken({ userId, email }),
        });
    },

    /**
     * Returns information about... yourself!
     */
    async me(req, res) {
        const { userId, email } = req.decoded;

        try {
            const {
                id, first_name, last_name, company, departement,
            } = await User.findOne({
                where: {
                    id: userId,
                },
            });

            return res.status(200).send({
                id,
                email,
                first_name,
                last_name,
                company,
                departement,
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue dans la lecture de vos informations en base de données.',
                    developer_message: error.message,
                },
            });
        }
    },

    /**
     * Updates some data about the current user
     */
    async edit(req, res) {
        // find the user
        const { userId } = req.decoded;
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
            data.password = crypto.pbkdf2Sync(password, user.salt, 10000, 512, 'sha512').toString('hex');
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
};
