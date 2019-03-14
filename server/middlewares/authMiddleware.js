const jwt = require('jsonwebtoken');
const { auth: authConfig } = require('#server/config');

module.exports = models => ({
    async checkToken(req, res, next) {
        const token = req.headers && req.headers['x-access-token'];

        if (token) {
            try {
                const decoded = jwt.verify(token, authConfig.secret);

                const user = await models.user.findOne(decoded.userId);
                if (user === null) {
                    return res.status(400).send({
                        error: {
                            code: 3,
                            user_message: 'Votre session a expiré',
                            developer_message: 'The access token is either invalid or expired',
                        },
                    });
                }

                req.user = user;
                next();
            } catch (error) {
                return res.status(400).send({
                    error: {
                        code: 2,
                        user_message: 'Votre session a expiré',
                        developer_message: 'The access token is either invalid or expired',
                    },
                });
            }

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
