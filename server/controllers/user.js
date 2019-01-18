const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { secret } = require('../config');
const { User, Departement } = require('../../db/models');

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

    async add(req, res) {
        const { email, password, departement } = req.body;

        // ensure the departement exists
        const d = await Departement.findOne({
            where: {
                code: departement,
            },
        });

        if (d === null) {
            return res.status(400).send({
                error: {
                    user_message: 'Département non reconnu',
                },
            });
        }

        // ensure no user exists with that email
        const user = await User.findOne({
            where: {
                email,
            },
        });

        if (user !== null) {
            return res.status(400).send({
                error: {
                    user_message: 'Cette adresse e-mail est déjà utilisée',
                },
            });
        }

        // create the user
        try {
            const salt = crypto.randomBytes(16).toString('hex');

            await User.create({
                email,
                password: crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex'),
                salt,
                departement,
            });

            return res.status(200).send({});
        } catch (error) {
            return res.status(500).send({
                developer_message: error.message,
                user_message: 'Une erreur est survenue lors de l\'enregistrement en base de données',
            });
        }
    },

    renewToken(req, res) {
        const { userId, email } = req.decoded;

        return res.status(200).send({
            token: generateToken({ userId, email }),
        });
    },
};
