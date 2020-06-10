const loaders = require('#server/loaders');
const { port } = require('#server/config');

module.exports = {
    start() {
        const app = loaders.express();
        loaders.routes(app);

        app.listen(port, () => {
            console.log(`Server is now running on port ${port}! :)`);
        });
    },
};
