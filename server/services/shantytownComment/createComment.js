const { sequelize } = require('#db/models');
const { create: $createComment } = require('#server/models/shantytownComment');
const { getComments: $getComments } = require('#server/models/shantytownModel')(sequelize);
const { triggerNewComment: $triggerNewComment } = require('#server/utils/slack');
const ServiceError = require('#server/errors/ServiceError');

/**
 * @typedef {Object} Service_ShantytownComment_Create_CommentData
 * @property {String}  description Contenu du commentaire
 * @property {Boolean} private `true` si le commentaire est privé
 */

function factory(dependencies) {
    const {
        createComment,
        getComments,
        triggerNewComment,
    } = {
        ...{
            createComment: $createComment,
            getComments: $getComments,
            triggerNewComment: $triggerNewComment,
        },
        ...dependencies,
    };

    /**
     * @param {Service_ShantytownComment_Create_CommentData} comment Commentaire
     * @param {Model_Shantytown} shantytown site rattaché au commentaire
     * @param {Model_User} author Auteur du commentaire
     *
     * @returns {Array.<Model_ShantytownComment>}
     */
    return async (comment, shantytown, author) => {
        // create the new comment
        try {
            await createComment({
                description: comment.description,
                private: comment.private,
                fk_shantytown: shantytown.id,
                created_by: author.id,
            });
        } catch (error) {
            throw new ServiceError('insert_failed', error);
        }

        try {
            await triggerNewComment(comment.description, shantytown, author);
        } catch (error) {
            // ignore
        }

        // return the updated list of comments
        let comments;
        try {
            comments = await getComments(author, [shantytown.id], false);
        } catch (error) {
            throw new ServiceError('fetch_failed', error);
        }

        return comments[shantytown.id];
    };
}

module.exports = factory();
module.exports.factory = factory;
