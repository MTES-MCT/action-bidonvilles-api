const {
    sequelize,
    ShantytownComment: ShantyTownComments,
} = require('#db/models');
const { getComments } = require('#server/models/shantytownModel')(sequelize);

module.exports = async (req, res, next) => {
    const {
        description,
        private: isPrivate,
        shantytown,
    } = req.body;

    // add the comment
    try {
        await ShantyTownComments.create({
            shantytown: shantytown.id,
            description,
            private: isPrivate,
            createdBy: req.user.id,
        });
    } catch (e) {
        res.status(500).send({
            error: {
                user_message: 'Une erreur est survenue dans l\'enregistrement de l\'étape en base de données',
            },
        });
        return next(e);
    }

    // get an updated list of the comments
    let comments;
    try {
        comments = await getComments(req.user, [shantytown.id], false);
    } catch (e) {
        res.status(500).send({
            error: {
                user_message: 'Le commentaire est enregistré mais la liste des commentaires n\'a pas pu être actualisée',
            },
        });
        return next(e);
    }

    // respond
    return res.status(200).send({
        comments: comments[shantytown.id],
    });
};
