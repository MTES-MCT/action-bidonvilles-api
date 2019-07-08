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
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'readUser',
            }], ...args),
        ],
        controllers.user.list,
    );
    app.get(
        '/me',
        middlewares.auth.authenticate,
        controllers.user.me,
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
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createUser',
            }], ...args),
        ],
        controllers.user.create,
    );
    app.get(
        '/users/:id/activate',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createUser',
            }], ...args),
        ],
        controllers.user.getActivationLink,
    );
    app.post(
        '/users/:id/activate',
        controllers.user.activate,
    );
    app.get(
        '/activation-tokens/:token/check',
        controllers.user.checkActivationToken,
    );

    // ngos
    app.get(
        '/ngos',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'readNgo',
        }], ...args),
        controllers.ngo.list,
    );
    app.get(
        '/ngos/search',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'readNgo',
        }], ...args),
        controllers.ngo.search,
    );
    app.post(
        '/ngos',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createNgo',
            }], ...args),
        ],
        controllers.ngo.create,
    );

    // plans
    app.get(
        '/plans',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'readPlan',
        }], ...args),
        controllers.plan.list,
    );
    app.get(
        '/plans/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'readPlan',
        }], ...args),
        controllers.plan.find,
    );
    app.delete(
        '/plans/:id',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'deletePlan',
        }], ...args),
        controllers.plan.delete,
    );
    app.post(
        '/plans',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createPlan',
            }], ...args),
        ],
        controllers.plan.create,
    );
    app.post(
        '/plans/:id/towns',
        middlewares.auth.authenticate,
        (...args) => middlewares.auth.checkPermissions([{
            type: 'feature',
            name: 'createTown',
        }], ...args),
        controllers.plan.link,
    );
    app.post(
        '/plan-details/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'updatePlan',
            }], ...args),
        ],
        controllers.plan.updateDetails,
    );

    // towns
    app.get(
        '/towns',
        middlewares.auth.authenticate,
        controllers.town.list,
    );
    app.get(
        '/towns/:id',
        middlewares.auth.authenticate,
        controllers.town.find,
    );
    app.post(
        '/towns',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createTown',
            }], ...args),
        ],
        controllers.town.add,
    );
    app.post(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'updateTown',
            }], ...args),
        ],
        controllers.town.edit,
    );
    app.post(
        '/towns/:id/close',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'closeTown',
            }], ...args),
        ],
        controllers.town.close,
    );
    app.delete(
        '/towns/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'deleteTown',
            }], ...args),
        ],
        controllers.town.delete,
    );
    app.post(
        '/towns/:id/comments',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([
                {
                    type: 'feature',
                    name: 'createComment',
                }], ...args),
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

    // actions
    app.get(
        '/actions',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'readAction',
            }], ...args),
        ],
        controllers.action.list,
    );
    app.get(
        '/actions/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'readAction',
            }], ...args),
        ],
        controllers.action.find,
    );
    app.post(
        '/actions',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createAction',
            }], ...args),
        ],
        controllers.action.add,
    );
    app.post(
        '/actions/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createAction',
            }], ...args),
        ],
        controllers.action.edit,
    );
    app.post(
        '/actions/:id/steps',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'createAction',
            }], ...args),
        ],
        controllers.action.addStep,
    );
    app.delete(
        '/actions/:id',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'deleteAction',
            }], ...args),
        ],
        controllers.action.delete,
    );

    // geo
    app.get(
        '/locations/search',
        middlewares.auth.authenticate,
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

    // stats
    app.get(
        '/stats',
        [
            middlewares.auth.authenticate,
            (...args) => middlewares.auth.checkPermissions([{
                type: 'feature',
                name: 'stats',
            }], ...args),
        ],
        controllers.stats.all,
    );

    return app;
};
