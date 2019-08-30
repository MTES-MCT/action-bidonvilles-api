const jwt = require('jsonwebtoken');
const { auth: authConfig } = require('#server/config');

class AuthenticateError extends Error {
    constructor(details, ...args) {
        super(details.user_message, ...args);
        this.details = details;
    }
}

module.exports = (models) => {
    async function authenticate(req) {
        const token = req.headers && req.headers['x-access-token'];
        if (!token) {
            throw new AuthenticateError({
                code: 1,
                user_message: 'Vous devez être connecté pour accéder à ce contenu',
                developer_message: 'The access token is missing',
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, authConfig.secret);
        } catch (error) {
            throw new AuthenticateError({
                code: 2,
                user_message: 'Votre session a expiré',
                developer_message: 'The access token is either invalid or expired',
            });
        }

        const user = await models.user.findOne(decoded.userId, {
            extended: true,
        });
        if (user === null) {
            throw new AuthenticateError({
                code: 3,
                user_message: 'Votre session a expiré',
                developer_message: 'The access token is either invalid or expired',
            });
        }

        if (user.active !== true || user.organization.active !== true) {
            throw new AuthenticateError({
                code: 4,
                user_message: 'Votre session a expiré',
                developer_message: 'The access token is either invalid or expired',
            });
        }

        return user;
    }

    function hasPermission(permissions, permission) {
        const [entity, feature] = permission.split('.');

        return Object.prototype.hasOwnProperty.call(permissions, entity)
            && Object.prototype.hasOwnProperty.call(permissions[entity], feature)
            && permissions[entity][feature].allowed === true;
    }

    const authMiddleware = {};

    authMiddleware.authenticate = async (req, res, next, respond = true) => {
        try {
            const user = await authenticate(req);
            req.user = user;
            req.user.isAllowedTo = (feature, entity) => hasPermission(user.permissions, `${entity}.${feature}`);
        } catch (error) {
            if (respond !== true) {
                throw error;
            }

            res.status(400).send({
                error: error.details,
            });
        }

        if (respond === true) {
            next();
        }
    };

    authMiddleware.checkPermissions = (requiredPermissions, req, res, next) => {
        if (!req.user || !req.user.permissions || !requiredPermissions) {
            res.status(500).send({
                error: {
                    code: 4,
                    user_message: 'Vous n\'avez pas accès à ces données',
                    developer_message: 'Tried to access a secured page without authentication',
                },
            });
            return;
        }

        if (!requiredPermissions.every(permission => hasPermission(req.user.permissions, permission))) {
            res.status(400).send({
                error: {
                    code: 5,
                    user_message: 'Vous n\'avez pas accès à ces données',
                    developer_message: 'Tried to access a secured page without all required permissions',
                },
            });
            return;
        }

        next();
    };

    return authMiddleware;
};
