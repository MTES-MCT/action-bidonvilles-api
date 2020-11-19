const loaders = require('#server/loaders');
const { port } = require('#server/config');

module.exports = {
    async start() {
        // app
        const app = loaders.express();

        loaders.routes(app);

        app.listen(port, () => {
            console.log(`Server is now running on port ${port}! :)`);
        });

        // agenda
        const agenda = loaders.agenda();
        loaders.agendaJobs(agenda);

        try {
            await agenda.start();
            console.log('Set scheduled jobs up');
        } catch (error) {
            console.log('Failed settings up scheduled jobs');
        }
    },
};
