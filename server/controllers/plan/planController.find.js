module.exports = models => async (req, res) => {
    try {
        const plans = await models.plan.findOne(req.params.id);
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
