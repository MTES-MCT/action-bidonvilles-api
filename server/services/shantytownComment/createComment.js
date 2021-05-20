const { sequelize } = require('#db/models');
const shantytownCommentModel = require('#server/models/shantytownComment');
const shantytownModel = require('#server/models/shantytownModel')(sequelize);
const slackUtils = require('#server/utils/slack');
const ServiceError = require('#server/errors/ServiceError');

/**
 * @param {Service_ShantytownComment_Create_CommentData} comment Commentaire
 * @param {Model_Shantytown} shantytown site rattaché au commentaire
 * @param {Model_User} author Auteur du commentaire
 *
 * @returns {Array.<Model_ShantytownComment>}
 */
module.exports = async (comment, shantytown, author) => {
    // create the new comment
    try {
        await shantytownCommentModel.create({
            description: comment.description,
            private: comment.private,
            fk_shantytown: shantytown.id,
            created_by: author.id,
        });
    } catch (error) {
        throw new ServiceError('insert_failed', error);
    }

    try {
        await slackUtils.triggerNewComment(comment.description, shantytown, author);
    } catch (error) {
        // ignore
    }

    // return the updated list of comments
    let comments;
    try {
        comments = await shantytownModel.getComments(author, [shantytown.id], false);
    } catch (error) {
        throw new ServiceError('fetch_failed', error);
    }

    return comments[shantytown.id];
};
