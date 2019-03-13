require('module-alias/register');

const { sequelize } = require('../db/models');
const dataAccess = require('#server/dataAccess')(sequelize);

const userController = require('#server/controllers/userController');
const authController = require('#server/auth');
const configController = require('#server/controllers/config');
const townController = require('#server/controllers/townController')(dataAccess);
const actionController = require('#server/controllers/actions');
const geoController = require('#server/controllers/geo');

const app = require('#server/app')({
    user: userController,
    auth: authController,
    config: configController,
    town: townController,
    action: actionController,
    geo: geoController,
});

app.listen(process.env.API_PORT || 5000, () => {
    console.log('Server is now running! :)');
});
