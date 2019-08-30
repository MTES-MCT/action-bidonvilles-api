const { toString: dateToString } = require('#server/utils/date');
const signature = require('./signature');
const { frontUrl } = require('#server/config');
const escape = require('escape-html');


module.exports = (user, date) => ({
    Subject: 'Nouvelle demande d\'ouverture de compte à la plateforme Résorption Bidonvilles',

    TextPart: `Cher administrateur,

        Vous avez reçu une demande d'ouverture de compte à la plateforme Résorption Bidonvilles.
        Pour ouvrir et paramétrer le compte de cet utilisateur, rendez-vous sur la plateforme à l'adresse suivante : ${frontUrl}/nouvel-utilisateur/${user.id}

        Merci,

        -
        Date de la demande : ${dateToString(date)}

        ${user.last_name.toUpperCase()} ${user.first_name}
        ${user.organization.name}${user.organization.location[user.organization.location.type] ? `
        ${user.organization.location[user.organization.location.type].name}` : ''}
        ${user.position}

        ${user.access_request_message}
        -

        ${signature.TextPart}`,

    HTMLPart: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "">
        <html>
            <head>
                <link href="https://fonts.googleapis.com/css?family=Open+Sans&display=swap" rel="stylesheet">
            </head>

            <body style="max-width: 600px; width: 600px;" bgcolor="#ffffff">
                <div class="container" style="font-family: 'Open Sans'; width: 600px;">
                    <table style="width: 600px; font-family: 'Open Sans'; color: #000000;" border="0" cellpadding="0" cellspacing="0" width="600">
                        <tbody>
                            <tr>
                                <td bgcolor="#ffffff">
                                    Cher administrateur,<br/>
                                    <br/>
                                    Vous avez reçu une demande d'ouverture de compte à la plateforme Résorption Bidonvilles.<br/>
                                    Pour ouvrir et paramétrer le compte de cet utilisateur, <a href="${frontUrl}/nouvel-utilisateur/${user.id}">rendez-vous sur la plateforme</a>.<br/>
                                    <br/>
                                    Merci,<br/>
                                    <br/>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#dddddd" style="padding: 10px;">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tbody>
                                            <tr>
                                                <td bgcolor="#dddddd">Date de la demande : ${dateToString(date)}<br/><br/></td>
                                            </tr>
                                            <tr>
                                                <td bgcolor="#dddddd">${user.last_name.toUpperCase()} ${user.first_name}<br/></td>
                                            </tr>
                                            <tr>
                                                <td bgcolor="#dddddd">${user.organization.name}<br/></td>
                                            </tr>
                                            ${user.organization.location[user.organization.location.type] ? `<tr>
                                                <td bgcolor="#dddddd">${user.organization.location[user.organization.location.type].name}<br/></td>
                                            </tr>` : ''}
                                            <tr>
                                                <td bgcolor="#dddddd">${user.position}<br/><br/></td>
                                            </tr>
                                            <tr>
                                                <td bgcolor="#dddddd">${escape(user.access_request_message).replace(/\n/g, '<br/>')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff"><br/><br/></td>
                            </tr>
                            ${signature.HTMLPart}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>`,

    InlinedAttachments: signature.InlinedAttachments,
});
