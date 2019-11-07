module.exports = models => ({
    async list(req, res) {
        try {
            const results = await models.shantytown.getHistory(req.user);
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