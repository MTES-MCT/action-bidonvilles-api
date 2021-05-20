const { toString: dateToString } = require('#server/utils/date');
const signature = require('./signature');
const { frontUrl } = require('#server/config');


module.exports = (shantytown, comment) => ({
    Subject: `[ resorption-bidonvilles ] - Nouveau message site "${shantytown.usename}"`,

    TextPart: `Bonjour,
    
    Un nouveau message a été publié par ${comment.createdBy.firstName} ${comment.createdBy.lastName.toUpperCase()} (${comment.createdBy.organization}) le ${dateToString(new Date(comment.createdAt * 1000))} sur le site situé ${shantytown.addressSimple} (${shantytown.departement.name}).

    "${comment.description}"

    Accéder à la fiche du site : ${frontUrl}/site/${shantytown.id}
    Contacter ${comment.createdBy.firstName} ${comment.createdBy.lastName.toUpperCase()} : ${frontUrl}/annuaire/${comment.createdBy.organizationId}

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
                                    Un nouveau message a été publié par ${comment.createdBy.firstName} ${comment.createdBy.lastName.toUpperCase()} (${comment.createdBy.organization}) le ${dateToString(new Date(comment.createdAt * 1000))} sur le site situé ${shantytown.addressSimple} (${shantytown.departement.name}).<br/>
                                    <br/>
                                    "${comment.description}"<br/>
                                    <br/>
                                    <a href="${frontUrl}/site/${shantytown.id}">Accéder à la fiche du site</a><br/>
                                    <br/>
                                    <a href="${frontUrl}/annuaire/${comment.createdBy.organizationId}">Contacter ${comment.createdBy.firstName} ${comment.createdBy.lastName.toUpperCase()}</a><br/>
                                    <br/>
                                    Cordialement,
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
});
