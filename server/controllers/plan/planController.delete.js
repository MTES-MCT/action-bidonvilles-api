module.exports = models => async (req, res) => {
    try {
        await models.plan.delete(req.params.id);
    } catch (error) {
        res.status(500).send({
            error: {
                user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                developer_message: error,
            },
        });
    }

    return res.status(200).send({});
};