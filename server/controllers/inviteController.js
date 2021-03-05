const {
    send: sendMail,
} = require('#server/utils/mail');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.invitation = require('#server/mails/invitation');

const sendEmailsInvitations = async (guests, greeter) => {
    for (let i = 0; i < guests.length; i += 1) {
        const data = {
            first_name: guests[i].firstname,
            last_name: guests[i].lastname,
            email: guests[i].email,
            greeter_first_name: greeter.first_name,
            greeter_last_name: greeter.last_name,
            greeter_organization_name: greeter.organization.name,
        };
        try {
            // eslint-disable-next-line no-await-in-loop
            await sendMail(data, MAIL_TEMPLATES.invitation(data));
        } catch (err) {
            // Ignore
        }
    }
};

module.exports = models => ({
    async invite(req, res) {
        const {
            guests,
            greeter,
        } = req.body;

        try {
            const theGreeter = await models.user.findOneByEmail(greeter.email, { extended: true }, req.user);

            if (Array.isArray(guests) && guests.length > 0) {
                // envoi du mail d'invitation
                try {
                    await sendEmailsInvitations(guests, theGreeter);
                } catch (err) {
                    return res.status(400).send({
                        error: {
                            developer_message: 'Invitations could not be sent',
                            user_message: 'Impossible d\'envoyer les invitations',
                        },
                    });
                }
                return res.status(200).send({});
            }
        } catch (err) {
            return res.status(400).send({
                error: {
                    developer_message: 'greeter has not been found in database or a problem occured while fetching greeter from database',
                    user_message: 'La personne a l\'initiative de l\'invitation n\'existe pas',
                },
            });
        }

        return res.status(400).send({
            error: {
                developer_message: 'A problem occured while sending invitations',
                user_message: 'Un problème n\'a pas permis d\'envoyer les invitations',
            },
        });
    },
});
