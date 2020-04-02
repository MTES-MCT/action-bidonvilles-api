const semver = require('semver');

module.exports = (models) => {
    const appVersionMiddleware = {};

    appVersionMiddleware.sync = async (req, res, next, respond = true) => {
        const version = req.headers && req.headers['x-app-version'];

        if (version === undefined || req.user.last_version === null || semver.lt(req.user.last_version, version)) {
            try {
                await models.user.update(req.user.id, {
                    last_version: version,
                });
                req.user.last_version = version;
            } catch (error) {
                // ignore
            }
        }

        if (respond === true) {
            next();
        }
    };

    return appVersionMiddleware;
};
