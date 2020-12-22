const agenda = require('#server/loaders/agendaLoader')();

module.exports = {
    scheduleEvent: {
        accessRequestIsPending(userId) {
            agenda.schedule('in 30 seconds', 'access_request_pending_1st', {
                userId,
            });

            agenda.schedule('in 1 minute', 'access_request_pending_2nd', {
                userId,
            });
        },

        accessPending(accessId) {
            agenda.schedule('in 1 minute', 'access_is_pending', {
                accessId,
            });
        },

        accessExpired(accessId) {
            agenda.schedule('in 2 minutes', 'access_is_expired', {
                accessId,
            });
        },
    },

    cancelEvent: {
        accessRequestIsPending(userId) {
            agenda.cancel({
                name: 'access_request_pending_1st',
                attrs: {
                    userId,
                },
            });

            agenda.cancel({
                name: 'access_request_pending_2nd',
                attrs: {
                    userId,
                },
            });
        },

        accessPending(accessId) {
            agenda.cancel({
                name: 'access_is_pending',
                attrs: {
                    accessId,
                },
            });
        },

        accessExpired(accessId) {
            agenda.cancel({
                name: 'access_is_expired',
                attrs: {
                    accessId,
                },
            });
        },
    },
};
