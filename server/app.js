const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = (middlewares, controllers) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/assets', express.static(path.resolve(__dirname, '../assets')));

    app.post(
        '/signin',
        controllers.user.signin,
    );
    app.get(
        '/refreshToken',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.user.renewToken,
    );
    app.get(
        '/config',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.config.list,
    );
    app.post(
        '/changelog',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.user.setLastChangelog,
    );

    // directory
    app.get(
        '/directory',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.directory.list,
    );

    // user
    app.get(
        '/users',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['user.list'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.user.list,
    );
    app.get(
        '/me',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.user.me,
    );
    app.get(
        '/users/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['user.read'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.user.get,
    );
    app.post(
        '/me',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.user.edit,
    );
    app.post(
        '/me/default-export',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.user.setDefaultExport,
    );
    app.post(
        '/users',
        async (...args) => {
            try {
                await middlewares.auth.authenticate(...args, false);
            } catch (error) {
                return controllers.user.signup(...args);
            }

            await middlewares.appVersion.sync(...args, false);
            return controllers.user.create(...args);
        },
    );
    app.post(
        '/users/:id/sendActivationLink',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['user.activate'], ...args),
        middlewares.appVersion.sync,
        controllers.user.sendActivationLink,
    );
    app.post(
        '/users/:id/denyAccess',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['user.activate'], ...args),
        middlewares.appVersion.sync,
        controllers.user.denyAccess,
    );
    app.post(
        '/users/:id/activate',
        controllers.user.activate,
    );
    app.post(
        '/users/:id/upgrade',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.user.upgrade,
    );
    app.get(
        '/activation-tokens/:token/check',
        controllers.user.checkActivationToken,
    );
    app.delete(
        '/users/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['user.deactivate'], ...args),
        middlewares.appVersion.sync,
        controllers.user.remove,
    );
    app.post(
        '/users/new-password',
        controllers.user.requestNewPassword,
    );
    app.get(
        '/password-tokens/:token/check',
        controllers.user.checkPasswordToken,
    );
    app.post(
        '/users/:id/newPassword',
        controllers.user.setNewPassword,
    );

    // plans
    app.get(
        '/plans',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['plan.list'], ...args),
        middlewares.appVersion.sync,
        controllers.plan.list,
    );
    app.get(
        '/plans/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['plan.read'], ...args),
        middlewares.appVersion.sync,
        controllers.plan.find,
    );
    app.post(
        '/plans',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['plan.create'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.plan.create,
    );
    app.post(
        '/plans/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['plan.update'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.plan.update,
    );
    app.post(
        '/plans/:id/states',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['plan.updateMarks'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.plan.addState,
    );
    app.patch(
        '/plans/:id',
        middlewares.auth.authenticate,
        async (req, res, next) => {
            // parse body to check the requested operation
            let controller;
            switch (req.body.operation) {
                case 'close':
                    try {
                        middlewares.auth.checkPermissions(['plan.close'], req, res, next, false);
                    } catch (error) {
                        return res.status(500).send({
                            success: false,
                        });
                    }

                    controller = controllers.plan.close;
                    break;

                default:
                    return res.status(404).send({});
            }

            // sync app-version
            try {
                await middlewares.appVersion.sync(req, res, next, false);
            } catch (error) {
                return res.status(500).send({});
            }

            // route to proper controller
            return controller(req, res, next);
        },
    );

    // towns
    app.get(
        '/towns/export',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.export'], ...args),
        controllers.town.export,
    );
    app.get(
        '/towns',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.list'], ...args),
        middlewares.appVersion.sync,
        controllers.town.list,
    );
    app.get(
        '/towns/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.read'], ...args),
        middlewares.appVersion.sync,
        controllers.town.find,
    );
    app.post(
        '/towns',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.create'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.town.add,
    );
    app.post(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.update'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.town.edit,
    );
    app.post(
        '/towns/:id/close',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.close'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.town.close,
    );
    app.delete(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.delete'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.town.delete,
    );
    app.post(
        '/towns/:id/comments',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown_comment.create'], ...args),
            middlewares.appVersion.sync,
        ],
        controllers.town.addComment,
    );
    app.post(
        '/towns/:id/comments/:commentId',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.town.updateComment,
    );
    app.post(
        '/towns/:id/covidComments',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.town.createCovidComment,
    );
    app.delete(
        '/towns/:id/comments/:commentId',
        [
            middlewares.auth.authenticate,
            middlewares.appVersion.sync,
        ],
        controllers.town.deleteComment,
    );

    // organizations
    app.get(
        '/organizations/search',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.organization.search,
    );
    app.get(
        '/organization-categories',
        controllers.organization.categories,
    );

    app.get(
        '/organization-categories/:categoryId/organization-types',
        controllers.organization.types,
    );

    app.get(
        '/organization-categories/:categoryId/users',
        controllers.organization.getMembersByCategory,
    );

    app.get(
        '/organization-categories/:categoryId/organizations',
        controllers.organization.getByCategory,
    );

    app.get(
        '/organization-types/:typeId/organizations',
        controllers.organization.getByType,
    );

    app.get(
        '/organizations/:organizationId/users',
        controllers.organization.getMembers,
    );

    // geo
    app.get(
        '/locations/search',
        controllers.geo.search,
    );
    app.get(
        '/cities/search',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.geo.searchCities,
    );
    app.get(
        '/epci/search',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.geo.searchEpci,
    );
    app.get(
        '/departements',
        controllers.geo.listDepartements,
    );

    // stats
    app.get(
        '/stats',
        async (req, res, next) => {
            try {
                await middlewares.auth.authenticate(req, res, next, false);
            } catch (error) {
                return controllers.stats.public(req, res, next);
            }

            try {
                middlewares.auth.checkPermissions(['stats.read'], req, res, next, false);
            } catch (error) {
                return res.status(500).send({
                    success: false,
                });
            }

            await middlewares.appVersion.sync(req, res, next, false);
            return controllers.stats.all(req, res, next);
        },
    );

    app.post(
        '/statistics/directory-views',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.stats.directoryView,
    );

    // user activities
    app.get(
        '/user-activities',
        middlewares.auth.authenticate,
        middlewares.appVersion.sync,
        controllers.userActivity.list,
    );

    return app;
};
