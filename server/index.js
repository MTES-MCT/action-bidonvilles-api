const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const configController = require('./controllers/config');
const townsController = require('./controllers/towns');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/config', configController.list);
app.get('/towns', townsController.list);
app.get('/towns/:id', townsController.find);
app.post('/towns', townsController.add);

app.listen(process.env.API_PORT || 5000, () => {
    console.log('Server is now running! :)');
});
