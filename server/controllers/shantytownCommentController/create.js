const {
    sequelize,
    ShantytownComment: ShantyTownComments,
} = require('#db/models');
const serializeComment = require('./helpers/serializeComment');

module.exports = async (req, res, next) => {
    const {
        description,
        private: isPrivate,
        shantytown,
    } = req.body;

    // add the step
    try {
        await ShantyTownComments.create({
            shantytown: shantytown.id,
            description,
            private: isPrivate,
            createdBy: req.user.id,
        });

        const filterPrivateComments = !req.user.isAllowedTo('listPrivate', 'shantytown_comment');

        const rawComments = await sequelize.query(
            `SELECT
                shantytown_comments.shantytown_comment_id AS "commentId",
                shantytown_comments.fk_shantytown AS "shantytownId",
                shantytown_comments.description AS "commentDescription",
                shantytown_comments.created_at AS "commentCreatedAt",
                shantytown_comments.created_by AS "commentCreatedBy",
                shantytown_comments.private AS "commentPrivate",
                users.first_name AS "userFirstName",
                users.last_name AS "userLastName",
                users.position AS "userPosition",
                organizations.organization_id AS "organizationId",
                organizations.name AS "organizationName",
                organizations.abbreviation AS "organizationAbbreviation"
            FROM shantytown_comments
            LEFT JOIN users ON shantytown_comments.created_by = users.user_id
            LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
            WHERE shantytown_comments.fk_shantytown = :id
            ${filterPrivateComments === true ? 'AND private IS FALSE ' : ''}
            ORDER BY shantytown_comments.created_at DESC`,
            {
                type: sequelize.QueryTypes.SELECT,
                replacements: {
                    id: shantytown.id,
                },
            },
        );

        return res.status(200).send({
            comments: rawComments.map(serializeComment),
        });
    } catch (e) {
        res.status(500).send({
            error: {
                developer_message: e.message,
                user_message: 'Une erreur est survenue dans l\'enregistrement de l\'étape en base de données',
            },
        });
        return next(e);
    }
};
