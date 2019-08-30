module.exports = models => ({

    async categories(req, res) {
        return res.status(200).send({
            success: true,
            response: {
                categories: await models.organizationCategory.findAll(),
            },
        });
    },

    async types(req, res) {
        return res.status(200).send({
            success: true,
            response: {
                types: await models.organizationType.findByCategory(req.params.categoryId, true),
            },
        });
    },

    async getByCategory(req, res) {
        return res.status(200).send({
            success: true,
            response: {
                organizations: await models.organization.findByCategory(req.params.categoryId, req.query.search || null),
            },
        });
    },

    async getByType(req, res) {
        return res.status(200).send({
            success: true,
            response: {
                organizations: await models.organization.findByType(req.params.typeId),
            },
        });
    },

});
