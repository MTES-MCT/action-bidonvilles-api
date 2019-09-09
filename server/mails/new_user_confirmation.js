const signature = require('./signature');

module.exports = () => ({
    Subject: '[ resorption-bidonvilles ] - Demande d\'accès',

    TextPart: `Bonjour,

    Merci de votre intérêt pour la plateforme Résorption Bidonvilles.
    Nous vous confirmons l'envoi de votre demande d'accès à un administrateur local.
    Vous recevrez prochainement un mail de sa part vous informant de la suite donnée à votre demande.

    Cordialement,

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
                                Merci de votre intérêt pour la plateforme Résorption Bidonvilles.<br/>
                                Nous vous confirmons l'envoi de votre demande d'accès à un administrateur local.<br/>
                                Vous recevrez prochainement un mail de sa part vous informant de la suite donnée à votre demande.<br/>
                                <br/>
                                Cordialement,<br/>
                                <br/>
                            </td>
                        </tr>
                        ${signature.HTMLPart}
                    </tbody>
                </table>
            </div>
        </body>
    </html>`,
});
