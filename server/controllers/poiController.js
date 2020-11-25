module.exports = models => ({
    async findAll(req, res) {
        const results = (await models.poi.findAll()).filter(poi => poi.categories.match(/Distribution alimentaire/));

        return res.status(200).send(results);
    },
});
