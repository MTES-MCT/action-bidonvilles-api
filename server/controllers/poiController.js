module.exports = models => ({
    async findAll(req, res) {
        const results = (await models.poi.findAll());

        return res.status(200).send(results);
    },
});
