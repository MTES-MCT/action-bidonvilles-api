const {
    send: sendMail,
} = require('#server/utils/mail');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.invitation = require('#server/mails/invitation');

const sendEmailsInvitations = async (guests, greeter) => {
    for (let i = 0; i < guests.length; i += 1) {
        const guest = {
            first_name: guests[i].first_name,
            last_name: guests[i].last_name,
            email: guests[i].email,
        };

        try {
            // eslint-disable-next-line no-await-in-loop
            await sendMail(guest, MAIL_TEMPLATES.invitation(guest, greeter));
        } catch (err) {
            // Ignore
        }
    }
};

module.exports = () => ({
    async invite(req, res, next) {
        const { greeter_full: greeter } = req;
        const { guests } = req.body;

        try {
            await sendEmailsInvitations(guests, greeter);
        } catch (err) {
            res.status(500).send({
                error: {
                    developer_message: 'Invitations could not be sent',
                    user_message: 'Impossible d\'envoyer les invitations',
                },
            });
            return next(err);
        }

        return res.status(200).send({});
    },
});
