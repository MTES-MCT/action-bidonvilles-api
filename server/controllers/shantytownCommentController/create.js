const shantytownCommentService = require('#server/services/shantytownComment');

module.exports = async (req, res, next) => {
    let comments;
    try {
        comments = await shantytownCommentService.createComment(
            {
                description: req.body.description,
                private: req.body.private,
            },
            req.body.shantytown.id,
            req.user,
        );
    } catch (error) {
        res.status(500).send({
            user_message: 'Une erreur est survenue lors de l\'enregistrement de votre commentaire',
        });
        return next(error);
    }

    return res.status(200).send({
        comments,
    });
};
