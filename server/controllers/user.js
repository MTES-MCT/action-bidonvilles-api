const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { secret } = require('../config');
const { User } = require('../../db/models');

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
            token: jwt.sign({ userId: user.id, email }, secret, { expiresIn: '2h' }),
        });
    },
};
