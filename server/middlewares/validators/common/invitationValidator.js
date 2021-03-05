const { body } = require('express-validator');
const { sequelize } = require('#db/models');
const userModel = require('#server/models/userModel')(sequelize);

module.exports = () => [

    body('greeter.email')
        .trim()
        .notEmpty().withMessage('Le courriel de la personne a l\'initiative de l\'invitation doit être renseigné')
        .isEmail()
        .withMessage('Le courriel de la personne a l\'initiative de l\'invitation n\'est pas valide')
        .normalizeEmail({
            gmail_remove_dots: false,
            gmail_remove_subaddress: false,
            gmail_convert_googlemaildotcom: false,
            outlookdotcom_remove_subaddress: false,
            yahoo_remove_subaddress: false,
            icloud_remove_subaddress: false,
        })
        .custom(async (value) => {
            let user = null;
            try {
                user = await userModel.findOneByEmail(value);
                if ((Object.keys(user).length < 1) || (user === null)) {
                    throw new Error('La personne a l\'initiative de l\'invitation n\'existe pas');
                }
            } catch (error) {
                throw new Error('La personne a l\'initiative de l\'invitation n\'a pas été trouvée');
            }
            return true;
        }),

    body('guests')
        .customSanitizer((value) => {
            if (value === undefined || value === null) {
                return [];
            }
            return value;
        })
        .isArray().bail()
        .withMessage('La liste des invités n\'est pas valide : envoi des invitations impossible')
        .notEmpty()
        .withMessage('La liste des invités n\'est pas valide : envoi des invitations impossible'),

    body('guests.*.firstname')
        .trim()
        .notEmpty().withMessage('Vous devez préciser le prénom d\'un invité'),

    body('guests.*.lastname')
        .trim()
        .notEmpty().withMessage('Vous devez préciser le nom d\'un invité'),

    body('guests.*.email')
        .trim()
        .notEmpty().bail()
        .withMessage('Vous devez préciser le courriel d\'un invité')
        .isEmail()
        .bail()
        .withMessage('Le courriel d\'au moins une invitation n\'est pas valide')
        .normalizeEmail({
            gmail_remove_dots: false,
            gmail_remove_subaddress: false,
            gmail_convert_googlemaildotcom: false,
            outlookdotcom_remove_subaddress: false,
            yahoo_remove_subaddress: false,
            icloud_remove_subaddress: false,
        })
        .custom(async (value) => {
            let user = null;
            try {
                user = await userModel.findOneByEmail(value);
            } catch (error) {
                throw new Error('Erreur lors du contrôle de l\'existence d\'un utilisateur à partir de son adresse de messagerie');
            }
            if (user !== null) {
                if (Object.keys(user).length > 0) {
                    /* TODO: faire remonter cette erreur quand la fonctionnalité permettant de récupérer le détail de l'erreur sera implémentée côté front.
                       Pour l'instant, on ne bloque pas l'envoi du courriel d'invitation, même si l'utilisateur invité existe déjà dans la table des users
                       Pour éviter de bloquer l'envoi des autres invitations */
                    // throw new Error('Un utilisateur ayant cette adresse existe déjà');
                }
            }
            return true;
        }),
];
