const {
    send: sendMail,
} = require('#server/utils/mail');
const { triggerPeopleInvitedAlert } = require('#server/utils/slack');
const { slack: slackConfig } = require('#server/config');

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

const sendSlackNotifications =  async (guests, greeter) => {
    for (let i = 0; i < guests.length; i += 1) {
        // Send a slack alert, if it fails, do nothing
        try {
            if (slackConfig && slackConfig.invite_people) {
                await triggerPeopleInvitedAlert(guests[i], greeter, "via le formulaire de demande d'accès") ;
            }
        } catch (err) {
            console.log(`Error with invited people webhook : ${err.message}`);
        }
    }
};


module.exports = () => ({
    async invite(req, res, next) {
        const { greeter_full: greeter } = req;
        const { guests } = req.body;

        // Send an email to each guest
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

        // Send a slack alert for each guest
        try {
            await sendSlackNotifications(guests, greeter);
        } catch (err) {
            res.status(500).send({
                error: {
                    developer_message: 'Slack notifications could not be sent',
                    user_message: 'Impossible d\'envoyer les notifications Slack',
                },
            });
            return next(err);
        }

        return res.status(200).send({});
    },
});
