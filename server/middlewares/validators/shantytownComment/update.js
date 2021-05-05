/* eslint-disable newline-per-chained-call */
const { body, param } = require('express-validator');
const shantytownCommentModel = require('#server/models/shantytownComment');

module.exports = [
    param('commentId')
        .custom(async (value, { req }) => {
            let comment;
            try {
                comment = await shantytownCommentModel.findOne(value);
            } catch (error) {
                throw new Error('Impossible de retrouver le commentaire à modifier en base de données');
            }

            if (comment === null) {
                throw new Error('Le commenter à modifier n\'existe pas');
            }

            req.body.comment = comment;
            return true;
        }),

    body('description')
        .trim()
        .notEmpty().withMessage('La description est obligatoire'),
];
