/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const { send: sendMail } = require('#server/utils/mail');

module.exports = {
    /**
     * Sends one of the email templates stored in `/mails`
     *
     * @param {string}    templateName Name of the email template (may be a path, without trailing .js)
     * @param {User}      recipient    Recipient of the email
     * @param {User}      [sender]     Sender of the email (used for reply-to)
     * @param {Array}     templateArgs Arguments to be passed to the email template
     *
     * @returns {Promise}
     */
    send(templateName, recipient, sender = null, templateArgs) {
        const templateFn = require(`#server/mails/${templateName}`);

        return sendMail(
            recipient,
            templateFn.apply(this, templateArgs),
            sender,
        );
    },
};
