const Sentry = require('@sentry/node');
const loaders = require('#server/loaders');
const { port } = require('#server/config');

module.exports = {
    async start() {
        // app
        const app = loaders.express();

        loaders.routes(app);

        // Report handled errors with next(error)
        app.use(async (
            err,
            req,
            res,
            next,
        ) => {
            Sentry.captureException(err);

            next();
        });

        // // Report unhandled errors
        // // The error handler must be before any other error middleware
        app.use(
            Sentry.Handlers.errorHandler(),
        );

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

        return app;
    },
};
