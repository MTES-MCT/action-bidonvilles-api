const { createComment: $createComment } = require('#server/services/shantytownComment');

function factory(dependencies = {}) {
    // resolve dependencies
    const { createComment } = {
        ...{ createComment: $createComment },
        ...dependencies,
    };

    // controller
    return async (req, res, next) => {
        let comments;
        try {
            comments = await createComment(
                {
                    description: req.body.description,
                    private: req.body.private,
                },
                req.body.shantytown.id,
                req.user,
            );
        } catch (error) {
            let message;
            switch (error && error.code) {
                case 'insert_failed':
                    message = 'Votre commentaire n\'a pas pu être enregistré.';
                    break;

                case 'fetch_failed':
                    message = 'Votre commentaire a bien été enregistré mais la liste des commentaires n\'a pas pu être actualisée.';
                    break;

                default:
                    message = 'Une erreur inconnue est survenue.';
            }

            res.status(500).send({
                user_message: message,
            });
            return next((error && error.nativeError) || error);
        }

        return res.status(200).send({
            comments,
        });
    };
}

module.exports = factory();
module.exports.factory = factory;
