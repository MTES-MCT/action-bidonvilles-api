const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

module.exports = (middlewares, controllers) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    app.post('/signin', controllers.user.signin);
    app.get('/refreshToken', middlewares.auth.checkToken, controllers.user.renewToken);
    app.get('/config', middlewares.auth.checkToken, controllers.config.list);

    // user
    app.get('/me', middlewares.auth.checkToken, controllers.user.me);
    app.post('/me', middlewares.auth.checkToken, controllers.user.edit);
    app.post('/users', middlewares.auth.checkToken, controllers.user.signup);

    // towns
    app.get('/towns', middlewares.auth.checkToken, controllers.town.list);
    app.get('/towns/:id', middlewares.auth.checkToken, controllers.town.find);
    app.post('/towns', middlewares.auth.checkToken, controllers.town.add);
    app.post('/towns/:id', middlewares.auth.checkToken, controllers.town.edit);
    app.post('/towns/:id/close', middlewares.auth.checkToken, controllers.town.close);
    app.delete('/towns/:id', middlewares.auth.checkToken, controllers.town.delete);
    app.post('/towns/:id/comments', middlewares.auth.checkToken, controllers.town.addComment);

    // actions
    app.get('/actions', middlewares.auth.checkToken, controllers.action.list);
    app.get('/actions/:id', middlewares.auth.checkToken, controllers.action.find);
    app.post('/actions', middlewares.auth.checkToken, controllers.action.add);
    app.post('/actions/:id', middlewares.auth.checkToken, controllers.action.edit);
    app.post('/actions/:id/steps', middlewares.auth.checkToken, controllers.action.addStep);
    app.delete('/actions/:id', middlewares.auth.checkToken, controllers.action.delete);

    // geo
    app.get('/locations/search', middlewares.auth.checkToken, controllers.geo.search);
    app.get('/cities/search', middlewares.auth.checkToken, controllers.geo.searchCities);
    app.get('/epci/search', middlewares.auth.checkToken, controllers.geo.searchEpci);

    return app;
};
