const { sequelize } = require('#db/models');

/**
 * @typedef {Object} Model_ShantytownComment_Data
 * @property {String}  description   Contenu du commentaire
 * @property {Number}  fk_shantytown `shantytown_id` du site rattaché au commentaire
 * @property {Number}  created_by    `user_id` de l'auteur du commentaire
 * @property {Boolean} private       `true` si le commentaire est privé
 */

/**
 * @param {Model_ShantytownComment_Data} data
 */
module.exports = data => sequelize.query(
    `INSERT INTO shantytown_comments(
        description,
        fk_shantytown,
        created_by,
        private
    )
    VALUES (
        :description,
        :fk_shantytown,
        :created_by,
        :private
    )`,
    {
        replacements: data,
    },
);
