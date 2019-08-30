const permissionsDescription = require('#server/permissions_description');

module.exports = models => ({
    async list(req, res) {
        const queries = {
            field_types: models.fieldType.findAll(),
            owner_types: models.ownerType.findAll(),
            social_origins: models.socialOrigin.findAll(),
            departements: models.departement.findAll(),
            regions: models.region.findAll(),
            closing_solutions: models.closingSolution.findAll(),
            action_types: models.actionType.findAll(),
            funding_types: models.fundingType.findAll(),
            plan_types: models.planType.findAll(),
            electricity_types: models.electricityType.findAll(),
            permissions_description: permissionsDescription,
        };

        const promises = Object.values(queries);
        const names = Object.keys(queries);

        return Promise.all(promises)
            .then((results) => {
                const response = {
                    user: req.user,
                };
                names.forEach((name, index) => {
                    response[name] = results[index];
                });

                return res.status(200).send(response);
            })
            .catch(error => res.status(500).send(error.message));
    },
});
