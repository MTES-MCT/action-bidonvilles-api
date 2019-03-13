require('module-alias/register');

const { port } = require('#server/config');
const controllers = require('#server/controllers');
const app = require('#server/app')(controllers);

app.listen(process.env.API_PORT || port, () => {
    console.log('Server is now running! :)');
});
