const { sequelize } = require('#db/models');
const { create: createComment } = require('#server/models/shantytownComment');
const { getComments } = require('#server/models/shantytownModel')(sequelize);

/**
 * @typedef {Object} Service_ShantytownComment_Create_CommentData
 * @property {String}  description Contenu du commentaire
 * @property {Boolean} private `true` si le commentaire est privé
 */

/**
 * @param {Service_ShantytownComment_Create_CommentData} comment Commentaire
 * @param {Number} shantytownId `shantytown_id` du site rattaché au commentaire
 * @param {Model_User} author Auteur du commentaire
 */
module.exports = async (comment, shantytownId, author) => {
    // create the new comment
    await createComment({
        description: comment.description,
        private: comment.private,
        fk_shantytown: shantytownId,
        created_by: author.id,
    });

    // return the updated list of comments
    const comments = await getComments(author, [shantytownId], false);
    return comments[shantytownId];
};
