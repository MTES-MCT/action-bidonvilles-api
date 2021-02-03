const {
    send: sendMail,
} = require('#server/utils/mail');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.invitation = require('#server/mails/invitation');

const sendEmailsInvitations = async (guests, greeter) => {
    for (let i = 0; i < guests.length; i += 1) {
        const data = {
            guest: guests[i],
            greeter,
        };
        // eslint-disable-next-line no-await-in-loop
        await sendMail(data, MAIL_TEMPLATES.invitation(data));
    }
};

module.exports = () => ({
    async invite(req, res) {
        const {
            guests,
            greeter,
        } = req.body;

        // envoi du mail d'invitation
        try {
            await sendEmailsInvitations(guests, greeter);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.log(err);
        }
        return res.status(200).send({});
    },
});
