const signature = require('./signature');
const { frontUrl } = require('#server/config');


module.exports = data => ({
    Subject: '[Résorption-bidonvilles] - Découvrez la plateforme Résorption-bidonvilles',

    TextPart: `Bonjour ${data.first_name},

        Connaissez-vous la plateforme Résorption-bidonvilles ? ${data.greeter_first_name}  ${data.greeter_last_name.toUpperCase()}, ${data.greeter_organization_name} vous invite à la découvrir !
        
        Résorption-Bidonvilles est un outil numérique de travail collaboratif pour accélérer la résorption des bidonvilles. Il s’adresse à tous les acteurs de terrain : les services de l’État, les DDCS, les collectivités territoriales, les opérateurs…
        
        Découvrir la plateforme: ${frontUrl}
        
        Vous souhaitez une démonstration personnalisée de la plateforme ? Vous avez des questions sur son utilisation ? N’hésitez pas à contacter Laure par mail ou téléphone : laure.dubuc@dihal.gouv.fr ou 01 40 81 31 54.
        Vous aussi vous voulez contribuer à la résorption des bidonvilles ? Demandez dès à présent votre accès : ${frontUrl}/#/contact 
        
        Cordialement,
    
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
                                    Bonjour ${data.first_name},<br/>
                                    <br/>
                                    Connaissez-vous la plateforme Résorption-bidonvilles ? ${data.greeter_first_name}  ${data.greeter_last_name.toUpperCase()}, ${data.greeter_organization_name} vous invite à la découvrir !<br/>
                                    <br/>
                                    Résorption-Bidonvilles est un outil numérique de travail collaboratif pour accélérer la résorption des bidonvilles. Il s’adresse à tous les acteurs de terrain : les services de l’État, les DDCS, les collectivités territoriales, les opérateurs…<br/>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff" align="center">
                                    <div><!--[if mso]>
                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${frontUrl}" style="height:40px;v-text-anchor:middle;width:200px;" arcsize="25%" stroke="f" fillcolor="#0053B3">
                                    <w:anchorlock/>
                                    <center>
                                    <![endif]-->
                                        <a href="${frontUrl}"
                                style="background-color:#0053B3;border-radius:10px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">Découvrir la plateforme</a>
                                    <!--[if mso]>
                                    </center>
                                    </v:roundrect>
                                    <![endif]--></div>
                                </td>
                            </tr>
                            <tr>
                                <td bgcolor="#ffffff">
                                    Vous souhaitez une démonstration personnalisée de la plateforme ? Vous avez des questions sur son utilisation ? N’hésitez pas à contacter Laure par mail ou téléphone : laure.dubuc@dihal.gouv.fr ou 01 40 81 31 54.<br/>
                                    Vous aussi vous voulez contribuer à la résorption des bidonvilles ? <a href="${frontUrl}/#/contact">Demandez dès à présent votre accès</a><br/>
                                    <br/>
                                    Merci,<br/>
                                    <br/>
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
