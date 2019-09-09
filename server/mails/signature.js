const { backUrl } = require('#server/config');

module.exports = {
    TextPart: `L'équipe de Résorption Bidonvilles
    -
    Connaître, partager, agir
    pour résorber les bidonvilles
    contact@resorption-bidonvilles.gouv.fr
    -
    La plateforme Résorption bidonvilles est développée par
    la Délégation Interministérielle à l'hébergement et l'accès au logement`,

    HTMLPart: `<tr>
        <td bgcolor="#ffffff">
            <img src="${backUrl}/assets/logo_rb.png" /><br/>
            <b color="red" style="font-weight: bold; color: red">Connaître, partager, agir</b><br/>
            <b color="red" style="font-weight: bold; color: red">pour résorber les bidonvilles</b><br/>
            <a href="mailto:contact@resorption-bidonvilles.beta.gouv.fr" color="red" style="color: red; text-decoration: none">contact@resorption-bidonvilles.beta.gouv.fr</a><br/>
            <hr />
        </td>
    </tr>
    <tr>
        <td bgcolor="#ffffff">
            <table border="0" cellpadding="0" cellspacing="0">
                <tbody>
                    <tr>
                        <td bgcolor="#ffffff" valign="middle"><img src="${backUrl}/assets/logo_dihal.png" /></td>
                        <td bgcolor="#ffffff" valign="middle"><img src="${backUrl}/assets/marianne.png" /></td>
                    </tr>
                </tbody>
            </table>
        </td>
    </tr>
    <tr>
        <td bgcolor="#ffffff">
            La plateforme Résorption bidonvilles est développée par<br/>
            la Délégation Interministérielle à l'hébergement et l'accès au logement
        </td>
    </tr>`,
};
