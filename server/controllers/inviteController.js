const {
    send: sendMail,
} = require('#server/utils/mail');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.invitation = require('#server/mails/invitation');

const sendEmailsInvitations = async (guests, greeter) => {
    for (let i = 0; i < guests.length; i += 1) {
        const guest = {
            email: guests[i].email,
            first_name: guests[i].first_name,
            last_name: guests[i].last_name,
            greeter_first_name: greeter.first_name,
            greeter_last_name: greeter.last_name,
            greeter_organization_name: greeter.organization_name,
        };
        // eslint-disable-next-line no-await-in-loop
        await sendMail(guest, MAIL_TEMPLATES.invitation(guest));
    }
};

module.exports = () => ({
    async invite(req, res) {
        const {
            guests,
            greeter,
        } = req.body;

        // envoi du mail d'invitation
        await sendEmailsInvitations(guests, greeter);
        return res.status(200).send({});
    },
});
