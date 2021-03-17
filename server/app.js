const Sentry = require('@sentry/node');
const loaders = require('#server/loaders');
const { port } = require('#server/config');

const sentryContextHandlers = (app) => {
    // TODO : We should ideally use these handlers, but our async wrapping logic in routesLoaders cause issues
    // => req.protocol is not defined / trust is not a function
    // app.use(Sentry.Handlers.requestHandler());
    // app.use(Sentry.Handlers.tracingHandler());

    // Workaround to still have url in context
    app.use(async (
        req,
        res,
        next,
    ) => {
        Sentry.setContext('req', { path: req.path, method: req.method });
        next();
    });
};


const sentryErrorHandlers = (app) => {
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

    // Report unhandled errors
    // The error handler must be before any other error middleware
    app.use(
        Sentry.Handlers.errorHandler(),
    );
};


module.exports = {
    async start() {
        // app
        const app = loaders.express();

        sentryContextHandlers(app);

        loaders.routes(app);

        sentryErrorHandlers(app);

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
