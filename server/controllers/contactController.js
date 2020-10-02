const userService = require('#server/services/userService');

const {
    send: sendMail,
} = require('#server/utils/mail');

const MAIL_TEMPLATES = {};
MAIL_TEMPLATES.new_user_confirmation = require('#server/mails/new_user_confirmation');
MAIL_TEMPLATES.new_user_alert = require('#server/mails/new_user_alert');
MAIL_TEMPLATES.contact_message = require('#server/mails/contact_message');


const sendEmailNewUserConfirmation = async (result) => {
    await sendMail(result, MAIL_TEMPLATES.new_user_confirmation());
};

const sendEmailNewUserAlertToAdmins = async (result, models) => {
    const user = await models.user.findOne(result.id, { extended: true });
    const admins = await models.user.getAdminsFor(user);
    const mailTemplate = MAIL_TEMPLATES.new_user_alert(user, new Date());

    for (let i = 0; i < admins.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sendMail(admins[i], mailTemplate);
    }
};

const sendEmailNewContactMessageToAdmins = async (data, models) => {
    const admins = await models.user.getNationalAdmins();
    const mailTemplate = MAIL_TEMPLATES.contact_message(data, new Date());

    for (let i = 0; i < admins.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sendMail(admins[i], mailTemplate);
    }
};

module.exports = models => ({
    async contact(req, res) {
        const { request_type, is_actor } = req.body;

        if (request_type.includes('access-request') && is_actor) {
            // create the user
            const result = await userService.create(
                req.body,
                [
                    { key: 'access_request_message', sanitizer: 'string' },
                ],
            );

            if (result.error) {
                return res.status(result.error.code).send(result.error.response);
            }

            try {
                await Promise.all([
                    sendEmailNewUserConfirmation(result),
                    sendEmailNewUserAlertToAdmins(result, models),
                ]);
            } catch (err) {
                // ignore
            }


            return res.status(200).send(result);
        }

        try {
            await sendEmailNewContactMessageToAdmins(req.body, models);
        } catch (err) {
            // ignore
        }


        return res.status(200).send();
    },
});
