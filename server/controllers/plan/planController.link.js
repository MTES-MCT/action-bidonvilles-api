module.exports = models => async (req, res) => {
    try {
        await models.plan.addTown(req.params.id, req.body.townId, req.user.id);
    } catch (error) {
        return res.status(500).send({
            error: {
                user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
            },
        });
    }

    return res.status(200).send({});
};
