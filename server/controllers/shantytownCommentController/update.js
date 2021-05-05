const {
    sequelize,
    ShantytownComment: ShantyTownComments,
} = require('#db/models');
const serializeComment = require('./helpers/serializeComment');

module.exports = async (req, res, next) => {
    let comment;
    try {
        comment = await ShantyTownComments.findOne({
            where: {
                shantytown_comment_id: req.params.commentId,
            },
        });
    } catch (error) {
        res.status(500).send({
            error: {
                developer_message: 'Failed to retrieve the comment',
                user_message: 'Impossible de retrouver le commentaire à modifier en base de données',
            },
        });
        return next(error);
    }

    if (comment.createdBy !== req.user.id && !req.user.isAllowedTo('moderate', 'shantytown_comment')) {
        return res.status(400).send({
            error: {
                user_message: 'Vous n\'avez pas accès à ces données',
                developer_message: 'Tried to access a secured page without authentication',
            },
        });
    }

    try {
        await sequelize.query(
            'UPDATE shantytown_comments SET description = :description, private = :private WHERE shantytown_comment_id = :id',
            {
                replacements: {
                    id: req.params.commentId,
                    description: req.body.description,
                    private: req.body.private,
                },
            },
        );

        const rawComments = await sequelize.query(
            `SELECT
                shantytown_comments.shantytown_comment_id AS "commentId",
                shantytown_comments.fk_shantytown AS "shantytownId",
                shantytown_comments.description AS "commentDescription",
                shantytown_comments.created_at AS "commentCreatedAt",
                shantytown_comments.created_by AS "commentCreatedBy",
                users.first_name AS "userFirstName",
                users.last_name AS "userLastName",
                users.position AS "userPosition",
                organizations.name AS "organizationName",
                organizations.abbreviation AS "organizationAbbreviation"
            FROM shantytown_comments
            LEFT JOIN users ON shantytown_comments.created_by = users.user_id
            LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
            WHERE shantytown_comments.fk_shantytown = :id
            ORDER BY shantytown_comments.created_at DESC`,
            {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                    id: req.params.id,
                },
            },
        );

        return res.status(200).send({
            comments: rawComments.map(serializeComment),
        });
    } catch (error) {
        res.status(500).send({
            error: {
                developer_message: 'Failed to update the comment',
                user_message: 'Impossible de modifier le commentaire',
            },
        });
        return next(error);
    }
};
