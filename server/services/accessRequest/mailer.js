const mailService = require('#server/services/mailService');

module.exports = {
    toAdmin: {
        newRequestNotification(admins, user) {
            return Promise.all(
                admins.map(admin => mailService.send(
                    'access_request/admin/new_request_notification',
                    admin,
                    user,
                    [user],
                )),
            );
        },

        firstRequestPendingNotification(admins, user) {
            return Promise.all(
                admins.map(admin => mailService.send(
                    'access_request/admin/request_pending_reminder_1',
                    admin,
                    user,
                    [user],
                )),
            );
        },

        secondRequestPendingNotification(admins, user) {
            return Promise.all(
                admins.map(admin => mailService.send(
                    'access_request/admin/request_pending_reminder_2',
                    admin,
                    user,
                    [user],
                )),
            );
        },

        accessExpired(admin, user, submitDate) {
            return mailService.send(
                'access_request/admin/access_expired',
                admin,
                user,
                [user, submitDate],
            );
        },

        accessActivated(admin, user) {
            return mailService.send(
                'access_request/admin/access_activated',
                admin,
                user,
                [user],
            );
        },
    },

    toUser: {
        newRequestConfirmation(user) {
            return mailService.send(
                'access_request/user/access_request_confirmation',
                user,
                null,
                [user],
            );
        },

        accessDenied(user, admin) {
            return mailService.send(
                'access_request/user/access_denied',
                user,
                admin,
                [user, admin],
            );
        },

        accessGranted(user, admin, activationLink, expiracyDate) {
            return mailService.send(
                'access_request/user/access_granted',
                user,
                admin,
                [admin, activationLink, expiracyDate],
            );
        },

        accessPending(user, admin, activationLink, expiracyDate) {
            return mailService.send(
                'access_request/user/access_pending',
                user,
                admin,
                [activationLink, expiracyDate],
            );
        },

        accessExpired(user, admin, expiracyDate) {
            return mailService.send(
                'access_request/user/access_expired',
                user,
                admin,
                [expiracyDate],
            );
        },
    },
};
