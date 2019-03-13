const {
    SocialOrigin, FieldType, OwnerType, ActionType, User, Departement, Region, ClosingSolution,
} = require('../../db/models');

module.exports = {
    async list(req, res) {
        const queries = {
            action_types: ActionType.findAll(),
            field_types: FieldType.findAll(),
            owner_types: OwnerType.findAll(),
            social_origins: SocialOrigin.findAll(),
            departements: Departement.findAll(),
            regions: Region.findAll(),
            closing_solutions: ClosingSolution.findAll(),
        };

        const promises = [];
        const names = [];
        Object.keys(queries).forEach((key) => {
            names.push(key);
            promises.push(queries[key]);
        });

        const user = await User.findOne({
            include: [
                Departement,
            ],
            where: {
                id: req.decoded.userId,
            },
        });

        return Promise.all(promises)
            .then((results) => {
                const response = {
                    user: {
                        map_center: [
                            user.Departement.latitude,
                            user.Departement.longitude,
                        ],
                    },
                };
                names.forEach((name, index) => {
                    response[name] = results[index];
                });

                return res.status(200).send(response);
            })
            .catch(error => res.status(400).send(error));
    },
};
