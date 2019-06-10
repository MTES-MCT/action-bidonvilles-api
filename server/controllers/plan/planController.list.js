module.exports = models => async (req, res) => {
    try {
        const filters = {};
        if (req.query.departement) {
            filters.fk_departement = [req.query.departement];
        }

        const plans = await models.plan.findAll(filters);
        res.status(200).send(plans);
    } catch (error) {
        res.status(500).send({
            error: {
                user_message: 'Une erreur est survenue lors de la récupération des données en base',
                developer_message: error.message,
            },
        });
    }
};
