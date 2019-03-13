require('module-alias/register');

const { port } = require('#server/config');
const { sequelize } = require('../db/models');
const dataAccess = require('#server/dataAccess')(sequelize);

const userController = require('#server/controllers/userController');
const authController = require('#server/controllers/authController');
const configController = require('#server/controllers/configController');
const townController = require('#server/controllers/townController')(dataAccess);
const actionController = require('#server/controllers/actionController');
const geoController = require('#server/controllers/geoController');

const app = require('#server/app')({
    user: userController,
    auth: authController,
    config: configController,
    town: townController,
    action: actionController,
    geo: geoController,
});

app.listen(process.env.API_PORT || port, () => {
    console.log('Server is now running! :)');
});
