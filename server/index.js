const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { checkToken } = require('./auth');
const userController = require('./controllers/user');
const configController = require('./controllers/config');
const townsController = require('./controllers/towns');
const actionsController = require('./controllers/actions');
const geoController = require('./controllers/geo');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/signin', userController.signin);
app.get('/refreshToken', checkToken, userController.renewToken);
app.get('/config', checkToken, configController.list);

// towns
app.get('/towns', checkToken, townsController.list);
app.get('/towns/:id', checkToken, townsController.find);
app.post('/towns', checkToken, townsController.add);
app.post('/towns/:id', checkToken, townsController.edit);
app.post('/towns/:id/close', checkToken, townsController.close);
app.delete('/towns/:id', checkToken, townsController.delete);
app.post('/towns/:id/comments', checkToken, townsController.addComment);

// actions
app.get('/actions', checkToken, actionsController.list);
app.get('/actions/:id', checkToken, actionsController.find);
app.post('/actions', checkToken, actionsController.add);
app.post('/actions/:id', checkToken, actionsController.edit);
app.post('/actions/:id/steps', checkToken, actionsController.addStep);
app.delete('/actions/:id', checkToken, actionsController.delete);

// geo
app.get('/locations/search', checkToken, geoController.search);
app.get('/cities/search', checkToken, geoController.searchCities);
app.get('/epci/search', checkToken, geoController.searchEpci);

app.listen(process.env.API_PORT || 5000, () => {
    console.log('Server is now running! :)');
});
