const mailService = require('#server/services/mailService');

module.exports = {
    toAdmin: {
        newRequestNotification(admins, user) {
            admins.forEach(admin => mailService.send(
                'access_request/admin/new_request_notification',
                admin,
                user,
                [user],
            ));
        },

        firstRequestPendingNotification(admins, user) {
            admins.forEach(admin => mailService.send(
                'access_request/admin/request_pending_reminder_1',
                admin,
                user,
                [user],
            ));
        },

        secondRequestPendingNotification(admins, user) {
            admins.forEach(admin => mailService.send(
                'access_request/admin/request_pending_reminder_2',
                admin,
                user,
                [user],
            ));
        },

        accessExpired(admin, user, submitDate) {
            mailService.send(
                'access_request/admin/access_expired',
                admin,
                user,
                [user, submitDate],
            );
        },

        accessActivated(admin, user) {
            mailService.send(
                'access_request/admin/access_activated',
                admin,
                user,
                [user],
            );
        },
    },

    toUser: {
        newRequestConfirmation(user) {
            mailService.send(
                'access_request/user/access_request_confirmation',
                user,
                null,
                [user],
            );
        },

        accessDenied(user, admin) {
            mailService.send(
                'access_request/user/access_denied',
                user,
                admin,
                [user, admin],
            );
        },

        accessGranted(user, admin, activationLink, expiracyDate) {
            mailService.send(
                'access_request/user/access_granted',
                user,
                admin,
                [admin, activationLink, expiracyDate],
            );
        },

        accessPending(user, activationLink, expiracyDate) {
            mailService.send(
                'access_request/user/access_pending',
                user,
                null,
                [activationLink, expiracyDate],
            );
        },

        accessExpired(user, expiracyDate) {
            mailService.send(
                'access_request/user/access_expired',
                user,
                null,
                [expiracyDate],
            );
        },
    },
};
