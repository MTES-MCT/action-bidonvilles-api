require('module-alias/register');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const packageJSON = require('../package.json');
const config = require('./config.js');

if (config.sentry.dsn) {
    Sentry.init({
        dsn: config.sentry.dsn,
        release: `rb-api@${packageJSON.version}`,
        environment: 'production',
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: true }),
            // enable Postres calls tracing
            new Tracing.Integrations.Postgres(), // Add this integration
        ],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });
}

const app = require('#server/app');

app.start();
