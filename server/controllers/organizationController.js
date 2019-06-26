module.exports = models => ({
    async list(req, res) {
        try {
            const organizations = await models.organization.findAll();
            res.status(200).send(organizations);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },
});
