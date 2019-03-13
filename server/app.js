const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

module.exports = (controllers) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    app.post('/signin', controllers.user.signin);
    app.get('/refreshToken', controllers.auth.checkToken, controllers.user.renewToken);
    app.get('/config', controllers.auth.checkToken, controllers.config.list);

    // user
    app.get('/me', controllers.auth.checkToken, controllers.user.me);
    app.post('/me', controllers.auth.checkToken, controllers.user.edit);
    app.post('/users', controllers.auth.checkToken, controllers.user.signup);

    // towns
    app.get('/towns', controllers.auth.checkToken, controllers.town.list);
    app.get('/towns/:id', controllers.auth.checkToken, controllers.town.find);
    app.post('/towns', controllers.auth.checkToken, controllers.town.add);
    app.post('/towns/:id', controllers.auth.checkToken, controllers.town.edit);
    app.post('/towns/:id/close', controllers.auth.checkToken, controllers.town.close);
    app.delete('/towns/:id', controllers.auth.checkToken, controllers.town.delete);
    app.post('/towns/:id/comments', controllers.auth.checkToken, controllers.town.addComment);

    // actions
    app.get('/actions', controllers.auth.checkToken, controllers.action.list);
    app.get('/actions/:id', controllers.auth.checkToken, controllers.action.find);
    app.post('/actions', controllers.auth.checkToken, controllers.action.add);
    app.post('/actions/:id', controllers.auth.checkToken, controllers.action.edit);
    app.post('/actions/:id/steps', controllers.auth.checkToken, controllers.action.addStep);
    app.delete('/actions/:id', controllers.auth.checkToken, controllers.action.delete);

    // geo
    app.get('/locations/search', controllers.auth.checkToken, controllers.geo.search);
    app.get('/cities/search', controllers.auth.checkToken, controllers.geo.searchCities);
    app.get('/epci/search', controllers.auth.checkToken, controllers.geo.searchEpci);

    return app;
};
