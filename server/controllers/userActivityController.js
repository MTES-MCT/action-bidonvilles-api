module.exports = models => ({
    async list(req, res) {
        try {
            let results = await models.shantytown.getHistory(req.user);

            if (req.filters.covid === '1') {
                results = results.filter(({ covid }) => covid !== null && covid !== undefined);

                let allowedDepartements = null;
                switch (req.user.organization.location.type) {
                    case 'nation':
                        break;

                    case 'region':
                    case 'epci':
                        allowedDepartements = (await models.geo
                            .getDepartementsFor(
                                req.user.organization.location.type,
                                req.user.organization.location.region.code,
                            ))
                            .map(({ code }) => code);
                        break;

                    case 'departement':
                        allowedDepartements = [req.user.organization.location.departement.code];
                        break;

                    case 'city':
                        allowedDepartements = [req.user.organization.location.departement.code];
                        break;

                    default:
                        allowedDepartements = [];
                }

                if (allowedDepartements !== null) {
                    results = results.filter(row => allowedDepartements.indexOf(row.shantytown.departement) !== -1);
                }
            }

            return res.status(200).send({
                success: true,
                response: results,
            });
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'SQL query failed',
                    user_message: 'Une erreur est survenue dans la lecture en base de données',
                },
            });
        }
    },
});
