const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { checkToken } = require('./auth');
const userController = require('./controllers/user');
const configController = require('./controllers/config');
const townsController = require('./controllers/towns');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/signin', userController.signin);
app.get('/refreshToken', checkToken, userController.renewToken);
app.get('/config', checkToken, configController.list);
app.get('/towns', checkToken, townsController.list);
app.get('/towns/:id', checkToken, townsController.find);
app.post('/towns', checkToken, townsController.add);
app.post('/towns/:id', checkToken, townsController.edit);

app.listen(process.env.API_PORT || 5000, () => {
    console.log('Server is now running! :)');
});
