require('module-alias/register');

const { port } = require('#server/config');
const middlewares = require('#server/middlewares');
const controllers = require('#server/controllers');
const app = require('#server/app')(middlewares, controllers);

app.listen(process.env.API_PORT || port, () => {
    console.log('Server is now running! :)');
});
