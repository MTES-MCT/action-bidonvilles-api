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
        middlewares.auth.authenticate,
        controllers.user.signup,
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

    return app;
};
