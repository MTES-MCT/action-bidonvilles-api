const { toString: dateToString } = require('#server/utils/date');
const signature = require('./signature');
const { frontUrl } = require('#server/config');
const permissionsDescription = require('#server/permissions_description');
const { generateUserSignature } = require('#server/utils/mail');

// ajouter picto
function formatPermissionItem(type, item) {
    if (type === 'html') {
        return `${item.label.replace(/%(.+?)%/g, '<u>$1</u>')}${item.comments ? `<br/><em>${item.comments}</em>` : ''}`;
    }

    return `${item.label.replace(/%(.+?)%/g, '$1')}${item.comments ? ` (${item.comments})` : ''}`;
}

function formatPermissionSection(type, title, items, options) {
    if (items.length === 0) {
        return null;
    }

    if (type === 'html') {
        const html = items.map((subSection) => {
            const firstItem = subSection[0];
            let str = `<li>${formatPermissionItem(type, firstItem)}`;

            if (subSection.length > 1) {
                const subitems = subSection
                    .slice(1)
                    .filter(item => !item.option || options.indexOf(item.option) === -1)
                    .map(item => `<li><em>${formatPermissionItem(type, item)}</em></li>`)
                    .join('');

                str += `<ul>${subitems}</ul>`;
            }

            return `${str}<br/></li>`;
        }).join('');

        return `<p><strong>${title}</strong></p><p><ul>${html}</ul></p>`;
    }

    const text = items.map(subSection => subSection.map(item => `- ${formatPermissionItem(type, item)}`).join('\n')).join('\n');
    return `${title} :\n${text}`;
}

function formatPermissions(user) {
    const permission = permissionsDescription[user.role_id];
    const sections = [
        { title: 'À l\'échelle nationale', items: permission.national_permissions },
        { title: 'Sur le territoire d\'intervention', items: permission.local_permissions },
    ];

    return {
        TextPart: sections.map(section => formatPermissionSection('text', section.title, section.items, user.permission_options)).filter(section => section !== null).join('\n\n'),
        HTMLPart: sections.map(section => formatPermissionSection('html', section.title, section.items, user.permission_options)).filter(section => section !== null).join(''),
    };
}

module.exports = (activatedUser, administrator, activationLink, expiracyDate) => {
    const { TextPart, HTMLPart } = formatPermissions(activatedUser);
    const adminSignature = generateUserSignature(administrator);

    return {
        Subject: '[ resorption-bidonvilles ] - Accès à votre compte',

        TextPart: `Bonjour,

        Vous avez demandé un accès à la plateforme numérique Résorption Bidonvilles le ${dateToString(new Date(activatedUser.created_at * 1000))}.
        L'${administrator.role} vous a ouvert un accès en tant que ${activatedUser.role}, ce qui vous permet de :

        ${TextPart}

        Pour utiliser la plateforme, activez dès maintenant votre compte en créant votre mot de passe (lien valide jusqu'au ${dateToString(expiracyDate, true)}).

        ${activationLink}

        ${adminSignature.TextPart}
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
                                    Vous avez demandé un accès à la plateforme numérique <a href="${frontUrl}">Résorption Bidonvilles</a> le ${dateToString(new Date(activatedUser.created_at * 1000))}.<br/>
                                    L'${administrator.role} vous a ouvert un accès en tant que ${activatedUser.role}, ce qui vous permet de :<br/>
                                    <br/>
                                    ${HTMLPart}<br/>
                                    Pour utiliser la plateforme, activez dès maintenant votre compte en créant votre mot de passe (lien valide jusqu'au ${dateToString(expiracyDate, true)}).<br/>
                                    <br/>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff" align="center">
                                    <div><!--[if mso]>
                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${activationLink}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="25%" stroke="f" fillcolor="#0053B3">
                                    <w:anchorlock/>
                                    <center>
                                    <![endif]-->
                                        <a href="${activationLink}"
                                style="background-color:#0053B3;border-radius:10px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">Activer mon compte</a>
                                    <!--[if mso]>
                                    </center>
                                    </v:roundrect>
                                    <![endif]--></div>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff">
                                    <br/>
                                    <br/>
                                    ${adminSignature.HTMLPart}
                                    <br/>
                                    <br/>
                                </td>
                            </tr>
                            ${signature.HTMLPart}
                        </tbody>
                    </table>
                </div>
            </body>
        </html>`,
    };
};
