/* eslint-disable newline-per-chained-call */
const { param } = require('express-validator');
const themesValidator = require('./utils/themes');

module.exports = [
    param('user_id')
        .toInt()
        .isInt().bail().withMessage('L\'identifiant de l\'intervenant est invalide')
        .custom(async (value, { req }) => {
            if (req.user.id !== value) {
                throw new Error('Vous ne pouvez pas modifier les champs d\'intervention d\'un autre intervenant');
            }

            if (!req.shantytown.actors.some(({ id }) => id === value)) {
                throw new Error('Vous ne faites pas partie des intervenants');
            }

            req.body.user = req.user;
            return true;
        }),

    themesValidator,
];
