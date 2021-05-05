const { sequelize } = require('sequelize');

/**
 * @param {Number} shantytownCommentId
 */
module.exports = async (shantytownCommentId) => {
    const rows = await sequelize.query(
        `SELECT
                sc.shantytown_comment_id,
                sc.description,
                sc.fk_shantytown,
                sc.private,
                sc.created_at,
                sc.created_by,
                sc.updated_at
            FROM shantytown_comments sc
            WHERE sc.shantytown_comment_id = :shantytownCommentId`,
        {
            replacements: {
                shantytownCommentId,
            },
        },
    );

    if (rows.length !== 1) {
        return null;
    }

    return rows[0];
};
