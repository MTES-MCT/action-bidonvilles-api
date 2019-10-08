module.exports = models => ({
    async list(req, res) {
        let organizations;
        try {
            organizations = await models.user.getDirectory();
        } catch (error) {
            return res.status(500).send({
                success: false,
                error: {
                    user_message: 'Une erreur est survenue lors de la lecture en base de données',
                    developer_message: error.message,
                },
            });
        }

        return res.status(200).send({
            success: true,
            response: {
                organizations,
            },
        });
    },
});
