const { mail: mailConfig } = require('#server/config');
const mailjet = require('node-mailjet').connect(mailConfig.publicKey, mailConfig.privateKey);

module.exports = {
    send(user, mailContent, replyTo = null) {
        return mailjet
            .post('send', { version: 'v3.1' })
            .request({
                Messages: [
                    Object.assign({
                        From: {
                            Email: 'contact@resorption-bidonvilles.beta.gouv.fr',
                            Name: 'Résorption Bidonvilles',
                        },
                        ReplyTo: replyTo !== null ? {
                            Email: replyTo.email,
                            Name: `${replyTo.last_name.toUpperCase()} ${replyTo.first_name}`,
                        } : undefined,
                        To: [
                            {
                                Email: user.email,
                                Name: `${user.first_name} ${user.last_name.toUpperCase()}`,
                            },
                        ],
                    }, mailContent),
                ],
            });
    },
};
