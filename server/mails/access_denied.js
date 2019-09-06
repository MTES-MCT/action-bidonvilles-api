const { toString: dateToString } = require('#server/utils/date');
const signature = require('./signature');

module.exports = (activatedUser, administrator) => ({
    Subject: '[ resorption-bidonvilles ] - Votre demande d\'accès',

    TextPart: `Bonjour,

    L'administrateur de votre territoire n'a pas donné suite à votre demande du ${dateToString(new Date(activatedUser.created_at * 1000))} d'accès à la plateforme Résorption Bidonvilles.
    Vous pouvez le contacter par retour de ce mail pour de plus amples informations.

    Cordialement,

    ${administrator.last_name.toUpperCase()} ${administrator.first_name}
    ${administrator.position} - ${administrator.organization.name}
    ${administrator.role} de resorption-bidonvilles.com
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
                                Bonjour,<br/>
                                <br/>
                                L'administrateur de votre territoire n'a pas donné suite à votre demande du ${dateToString(new Date(activatedUser.created_at * 1000))} d'accès à la plateforme Résorption Bidonvilles.<br/>
                                Vous pouvez le contacter par retour de ce mail pour de plus amples informations.<br/>
                                <br/>
                                Cordialement,<br/>
                                <br/>
                                ${administrator.last_name.toUpperCase()} ${administrator.first_name}<br/>
                                ${administrator.position} - ${administrator.organization.name}<br/>
                                ${administrator.role} de resorption-bidonvilles.com<br/>
                                <br/>
                            </td>
                        </tr>
                        ${signature.HTMLPart}
                    </tbody>
                </table>
            </div>
        </body>
    </html>`,

    InlinedAttachments: signature.InlinedAttachments,
});
