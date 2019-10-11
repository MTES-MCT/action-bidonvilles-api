const semver = require('semver');

module.exports = (models) => {
    const appVersionMiddleware = {};

    appVersionMiddleware.sync = async (req, res, next) => {
        const version = req.headers && req.headers['x-app-version'];

        if (semver.lt(req.user.last_version, version)) {
            try {
                await models.user.update(req.user.id, {
                    last_version: version,
                });
                req.user.last_version = version;
            } catch (error) {
                // ignore
            }
        }

        next();
    };

    return appVersionMiddleware;
};
