const { sequelize } = require('#db/models/index');
const { user: userModel } = require('#server/models/index')(sequelize);

const sendEmail = require('./mailer');
const { scheduleEvent, cancelEvent } = require('./scheduler');

function isAccessRequestPending(user) {
    return user.status === 'new' && user.last_activation_link_sent_on === null;
}

module.exports = {
    /**
     *
     */
    async resetRequestsForUser(user) {
        cancelEvent.accessRequestIsPending(user);
        cancelEvent.accessPending(user);
        cancelEvent.accessExpired(user);
    },

    /**
     * Handle new access request
     *
     * @param {User} user
     */
    async handleNewAccessRequest(user) {
        const admins = await userModel.getAdminsFor(user.id);

        // notify user and admin
        sendEmail.toUser.newRequestConfirmation(user);
        sendEmail.toAdmin.newRequestNotification(admins, user);

        // schedule events
        scheduleEvent.accessRequestIsPending(user.id);
    },

    /**
     * Handle access request pending
     *
     * @param {Boolean} firstNotification Wether this is the first or the second pending notification
     * @param {Number}  userId
     */
    async handleAccessRequestPending(firstNotification, userId) {
        // fetch data
        const user = await userModel.findOne(userId);
        if (user === null || !isAccessRequestPending(user)) {
            return;
        }

        const admins = await userModel.getAdminsFor(user.id);

        // notify admin
        if (firstNotification === true) {
            sendEmail.toAdmin.firstRequestPendingNotification(admins, user);
        } else {
            sendEmail.toAdmin.secondRequestPendingNotification(admins, user);
        }
    },

    /**
     * Handle access request denied
     *
     * @param {User} user
     * @param {User} admin
     */
    handleAccessRequestDenied(user, admin) {
        // notify user
        sendEmail.toUser.accessDenied(user, admin);

        // cancel scheduled events
        cancelEvent.accessRequestIsPending(user.id);
    },

    /**
     * Handle access request approved
     *
     * @param {User}   user
     * @param {User}   admin
     * @param {String} activationLink
     * @param {Number} expiracyDate   Timestamp in seconds
     * @param {Number} accessId
     */
    async handleAccessRequestApproved(user, admin, activationLink, expiracyDate, accessId) {
        // notify user
        sendEmail.toUser.accessGranted(user, admin, activationLink, expiracyDate);

        // schedule new events
        cancelEvent.accessRequestIsPending(user.id);
        scheduleEvent.accessPending(accessId);
        scheduleEvent.accessExpired(accessId);
    },

    /**
     * Handle access is pending
     *
     * @param {Number} accessId
     */
    async handleAccessPending(accessId) {
        // fetch data
        const user = await userModel.findOneByAccess(accessId);
        if (user === null) {
            return;
        }

        // notify the user
        sendEmail.toUser.accessPending(user);
    },

    /**
     * Handle access expired
     *
     * @param {Number} accessId
     */
    async handleAccessExpired(accessId) {
        // fetch data
        const user = await userModel.findOneByAccess(accessId);
        if (user === null || (Date.now() / 1000) < expiracyDate) {
            return;
        }

        const admin = await userModel.findOne(adminId);
        if (admin === null) {
            return;
        }

        // notify the user and the admin
        sendEmail.toUser.accessExpired(user, expiracyDate);
        sendEmail.toAdmin.accessExpired(admin, user, submitDate);
    },

    /**
     * Handle access activation
     *
     * @param {User} user
     */
    async handleAccessActivated(user) {
        sendEmail.toAdmin.accessActivated(admin, user);

        cancelEvent.accessPending(user.id, activationLink, expiracyDate);
        cancelEvent.accessExpired(user.id, admin.id, user.last_activation_link_sent_on, expiracyDate);
    },
};
