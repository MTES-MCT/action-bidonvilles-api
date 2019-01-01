const { SocialOrigin, FieldType, OwnerType } = require('../../db/models');

module.exports = {
    list(req, res) {
        const queries = {
            field_types: FieldType.findAll(),
            owner_types: OwnerType.findAll(),
            social_origins: SocialOrigin.findAll(),
        };

        const promises = [];
        const names = [];
        Object.keys(queries).forEach((key) => {
            names.push(key);
            promises.push(queries[key]);
        });

        return Promise.all(promises)
            .then((results) => {
                const response = {
                    user: {
                        email: 'whatever',
                        map_center: [43.3050621, 0.684586],
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
