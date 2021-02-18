
const mailService = require('#server/services/mailService');

module.exports = () => async (req, res) => {
    try {
        await mailService.send(
            'shantytown_actors/invitation',
            {
                email: req.body.email,
            },
            null,
            [
                req.user,
                req.shantytown,
            ],
        );
    } catch (error) {
        return res.status(500).send({
            user_message: 'Une erreur est survenue lors de l\'envoi du courriel',
        });
    }

    return res.status(204).send({});
};
