const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

module.exports = (middlewares, controllers) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    app.post(
        '/signin',
        controllers.user.signin,
    );
    app.get(
        '/refreshToken',
        middlewares.auth.authenticate,
        controllers.user.renewToken,
    );
    app.get(
        '/config',
        middlewares.auth.authenticate,
        controllers.config.list,
    );

    // user
    app.get(
        '/users',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['user.list'], ...args),
        ],
        controllers.user.list,
    );
    app.get(
        '/me',
        middlewares.auth.authenticate,
        controllers.user.me,
    );
    app.get(
        '/users/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['user.read'], ...args),
        ],
        controllers.user.get,
    );
    app.post(
        '/me',
        middlewares.auth.authenticate,
        controllers.user.edit,
    );
    app.post(
        '/me/default-export',
        middlewares.auth.authenticate,
        controllers.user.setDefaultExport,
    );
    app.post(
        '/users',
        async (...args) => {
            try {
                await middlewares.auth.authenticate(...args, false);
                return controllers.user.create(...args);
            } catch (error) {
                return controllers.user.signup(...args);
            }
        },
    );
    app.post(
        '/users/:id/sendActivationLink',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['user.activate'], ...args),
        controllers.user.sendActivationLink,
    );
    app.post(
        '/users/:id/denyAccess',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['user.activate'], ...args),
        controllers.user.denyAccess,
    );
    app.post(
        '/users/:id/activate',
        controllers.user.activate,
    );
    app.post(
        '/users/:id/upgrade',
        middlewares.auth.authenticate,
        controllers.user.upgrade,
    );
    app.get(
        '/activation-tokens/:token/check',
        controllers.user.checkActivationToken,
    );

    // plans
    app.get(
        '/plans',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['plan.list'], ...args),
        controllers.plan.list,
    );
    app.get(
        '/plans/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['plan.read'], ...args),
        controllers.plan.find,
    );
    app.delete(
        '/plans/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['plan.delete'], ...args),
        controllers.plan.delete,
    );
    app.post(
        '/plans',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['plan.create'], ...args),
        ],
        controllers.plan.create,
    );
    app.post(
        '/plans/:id/towns',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.create'], ...args),
        controllers.plan.link,
    );
    app.post(
        '/plan-details/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['plan.update'], ...args),
        ],
        controllers.plan.updateDetails,
    );

    // towns
    app.get(
        '/towns',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.list'], ...args),
        controllers.town.list,
    );
    app.get(
        '/towns/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions(['shantytown.read'], ...args),
        controllers.town.find,
    );
    app.post(
        '/towns',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.create'], ...args),
        ],
        controllers.town.add,
    );
    app.post(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.update'], ...args),
        ],
        controllers.town.edit,
    );
    app.post(
        '/towns/:id/close',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.close'], ...args),
        ],
        controllers.town.close,
    );
    app.delete(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown.delete'], ...args),
        ],
        controllers.town.delete,
    );
    app.post(
        '/towns/:id/comments',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['shantytown_comment.create'], ...args),
        ],
        controllers.town.addComment,
    );
    app.post(
        '/towns/:id/comments/:commentId',
        [
            middlewares.auth.authenticate,
        ],
        controllers.town.updateComment,
    );
    app.delete(
        '/towns/:id/comments/:commentId',
        [
            middlewares.auth.authenticate,
        ],
        controllers.town.deleteComment,
    );

    // organizations
    app.get(
        '/organization-categories',
        controllers.organization.categories,
    );

    app.get(
        '/organization-categories/:categoryId/organization-types',
        controllers.organization.types,
    );

    app.get(
        '/organization-categories/:categoryId/organizations',
        controllers.organization.getByCategory,
    );

    app.get(
        '/organization-types/:typeId/organizations',
        controllers.organization.getByType,
    );

    // geo
    app.get(
        '/locations/search',
        controllers.geo.search,
    );
    app.get(
        '/cities/search',
        middlewares.auth.authenticate,
        controllers.geo.searchCities,
    );
    app.get(
        '/epci/search',
        middlewares.auth.authenticate,
        controllers.geo.searchEpci,
    );
    app.get(
        '/departements',
        controllers.geo.listDepartements,
    );

    // stats
    app.get(
        '/stats',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions(['stats.list'], ...args),
        ],
        controllers.stats.all,
    );

    return app;
};
