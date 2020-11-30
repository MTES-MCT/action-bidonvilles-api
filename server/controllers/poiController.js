module.exports = models => ({
    async findAll(req, res) {
        try {
            const results = (await models.poi.findAll());
            return res.status(200).send(results);
        } catch (error) {
            return res.status(500).send({ user_message: 'Une erreur est survenue lors de la lecture en base de données' });
        }
    },
});
