const agenda = require('#server/loaders/agendaLoader')();

module.exports = {
    scheduleEvent: {
        accessRequestIsPending(userId) {
            agenda.schedule('in 7 days', 'access_request_is_pending_1st', {
                userId,
            });

            agenda.schedule('in 10 days', 'access_request_is_pending_2nd', {
                userId,
            });
        },

        accessPending(accessId) {
            agenda.schedule('in 4 days', 'access_is_pending', {
                accessId,
            });
        },

        accessExpired(accessId) {
            agenda.schedule('in 8 days', 'access_is_expired', {
                accessId,
            });
        },
    },

    cancelEvent: {
        accessRequestIsPending(userId) {
            agenda.cancel({
                name: 'access_request_is_pending_1st',
                attrs: {
                    userId,
                },
            });

            agenda.cancel({
                name: 'access_request_is_pending_2nd',
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
