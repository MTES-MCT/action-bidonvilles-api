const { sequelize } = require('#db/models');
const { create: createComment } = require('#server/models/shantytownComment');
const { getComments } = require('#server/models/shantytownModel')(sequelize);
const ServiceError = require('#server/errors/ServiceError');

/**
 * @typedef {Object} Service_ShantytownComment_Create_CommentData
 * @property {String}  description Contenu du commentaire
 * @property {Boolean} private `true` si le commentaire est privé
 */

/**
 * @param {Service_ShantytownComment_Create_CommentData} comment Commentaire
 * @param {Number} shantytownId `shantytown_id` du site rattaché au commentaire
 * @param {Model_User} author Auteur du commentaire
 *
 * @returns {Array.<Model_ShantytownComment>}
 */
module.exports = async (comment, shantytownId, author) => {
    // create the new comment
    try {
        await createComment({
            description: comment.description,
            private: comment.private,
            fk_shantytown: shantytownId,
            created_by: author.id,
        });
    } catch (error) {
        throw new ServiceError('insert_failed', error);
    }

    // return the updated list of comments
    let comments;
    try {
        comments = await getComments(author, [shantytownId], false);
    } catch (error) {
        throw new ServiceError('fetch_failed', error);
    }

    return comments[shantytownId];
};
