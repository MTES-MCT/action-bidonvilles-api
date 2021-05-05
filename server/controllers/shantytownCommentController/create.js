const { trim } = require('validator');
const {
    sequelize,
    Shantytown: ShantyTowns,
    ShantytownComment: ShantyTownComments,
} = require('#db/models');
const serializeComment = require('./helpers/serializeComment');

module.exports = async (req, res, next) => {
    const {
        description,
        private: privateField,
    } = req.body;

    // get the related town
    let shantytown;
    try {
        shantytown = await ShantyTowns.findOne({
            where: {
                shantytown_id: req.params.id,
            },
        });
    } catch (error) {
        res.status(500).send({
            error: {
                developer_message: 'Failed to retrieve the shantytown',
                user_message: 'Impossible de retrouver le site concerné en base de données',
            },
        });
        return next(error);
    }

    if (shantytown === null) {
        return res.status(404).send({
            error: {
                developer_message: 'Shantytown does not exist',
                user_message: 'Le site concerné par le commentaire n\'existe pas',
            },
        });
    }

    // ensure the description is not empty
    const trimmedDescription = trim(description) || null;
    if (trimmedDescription === null || trimmedDescription.length === 0) {
        return res.status(404).send({
            error: {
                developer_message: 'The submitted data contains errors',
                user_message: 'Certaines données sont invalides',
                fields: {
                    description: ['La description est obligatoire'],
                },
            },
        });
    }

    // add the step
    try {
        await ShantyTownComments.create({
            shantytown: shantytown.id,
            description: trimmedDescription,
            private: privateField,
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
