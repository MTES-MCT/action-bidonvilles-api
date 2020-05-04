const permissionsDescription = require('#server/permissions_description');
const { activationTokenExpiresIn } = require('#server/config');

module.exports = models => ({
    async list(req, res) {
        const queries = {
            field_types: models.fieldType.findAll(),
            owner_types: models.ownerType.findAll(),
            social_origins: models.socialOrigin.findAll(),
            departements: models.departement.findAll(),
            regions: models.region.findAll(),
            closing_solutions: models.closingSolution.findAll(),
            etp_types: models.etpType.findAll(),
            finance_types: models.financeType.findAll(),
            plan_categories: models.planCategory.findAll(),
            topics: models.topic.findAll(),
            electricity_types: models.electricityType.findAll(),
            permissions_description: permissionsDescription,
            user: models.user.findOne(req.user.id, { extended: true }),
            changelog: models.changelog.getLastChangelogFor(req.user),
            version_charte_engagement: models.charteEngagement.getLatest(),
        };

        const promises = Object.values(queries);
        const names = Object.keys(queries);

        return Promise.all(promises)
            .then((results) => {
                const response = {
                    activation_token_expires_in: parseInt(activationTokenExpiresIn, 10) * 3600,
                };
                names.forEach((name, index) => {
                    response[name] = results[index];
                });

                return res.status(200).send(response);
            })
            .catch(error => res.status(500).send(error.message));
    },
});
