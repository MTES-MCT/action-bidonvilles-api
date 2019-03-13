const jwt = require('jsonwebtoken');
const { auth: authConfig } = require('#server/config');

module.exports = () => ({
    checkToken: (req, res, next) => {
        const token = req.headers && req.headers['x-access-token'];

        if (token) {
            jwt.verify(token, authConfig.secret, (err, decoded) => {
                if (err) {
                    return res.status(400).send({
                        error: {
                            code: 2,
                            user_message: 'Votre session a expiré',
                            developer_message: 'The access token is either invalid or expired',
                        },
                    });
                }

                req.decoded = decoded;
                next();
                return undefined;
            });

            return undefined;
        }

        return res.status(400).send({
            error: {
                code: 1,
                user_message: 'Vous devez être connecté pour accéder à ce contenu',
                developer_message: 'The access token is missing',
            },
        });
    },
});
