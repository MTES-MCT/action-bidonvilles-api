
const { sequelize } = require('#db/models');

module.exports = models => async (req, res) => {
    let actors;
    try {
        actors = await sequelize.transaction(async (transaction) => {
            await models.shantytownActor.removeTheme(
                req.shantytown.id,
                req.body.user.id,
                req.params.theme_id,
                req.user.id,
                transaction,
            );

            return models.shantytownActor.findAll(
                req.shantytown.id,
                transaction,
            );
        });
    } catch (error) {
        return res.status(500).send({
            user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
        });
    }

    const actor = actors
        .map(models.shantytownActor.serializeActor)
        .find(({ id }) => id === req.body.user.id);

    return res.status(200).send(actor);
};
