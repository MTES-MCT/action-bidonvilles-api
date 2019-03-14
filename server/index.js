require('module-alias/register');

const { port } = require('#server/config');
const { sequelize } = require('#db/models');
const models = require('#server/models')(sequelize);
const middlewares = require('#server/middlewares')(models);
const controllers = require('#server/controllers')(models);
const app = require('#server/app')(middlewares, controllers);

app.listen(process.env.API_PORT || port, () => {
    console.log('Server is now running! :)');
});
