const { sequelize } = require('#db/models');
const url = require('url');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = models => ({
    async list(req, res) {
        try {
            const ngos = await models.ngo.findAll();
            res.status(200).send(ngos);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },

    async create(req, res) {
        if (!req.body.name || !trim(req.body.name)) {
            return res.status(500).send({
                success: false,
                error: {
                    user_message: 'Certaines données sont invalides ou manquantes',
                    fields: {
                        name: ['Le nom de l\'opérateur est obligatoire'],
                    },
                },
            });
        }

        let name;
        try {
            name = await models.ngo.findOneByName(req.body.name);
        } catch (error) {
            return res.status(500).send({
                success: false,
                error: {
                    user_message: 'Une erreur est survenue lors de la lecture en base de données',
                },
            });
        }

        if (name !== null) {
            return res.status(500).send({
                success: false,
                error: {
                    user_message: 'Certaines données sont invalides ou manquantes',
                    fields: {
                        name: ['Un opérateur portant ce nom existe déjà'],
                    },
                },
            });
        }

        try {
            await models.ngo.create(req.body, req.user.id);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                },
            });
        }

        return res.status(200).send({});
    },

    async search(req, res) {
        const { query: { q } } = url.parse(req.url, true);

        const query = trim(q);
        if (query === null || query === '') {
            return res.status(400).send({
                error: {
                    developer_message: 'Empty or missing query',
                    user_message: 'La recherche ne peut pas être vide',
                },
            });
        }

        try {
            const results = await sequelize.query(`
                SELECT
                    ngos.ngo_id,
                    ngos.name AS label
                FROM
                    ngos
                WHERE
                    REPLACE(ngos.name, '-', ' ') ILIKE REPLACE(?, '-', ' ')
                ORDER BY
                    CASE
                        WHEN REPLACE(ngos.name, '-', ' ') ILIKE REPLACE(?, '-', ' ') THEN 1
                        ELSE 2
                    END,
                    ngos.name ASC`,
            {
                replacements: [
                    `%${query}%`,
                    `${query}%`,
                ],
                type: sequelize.QueryTypes.SELECT,
            });

            return res.status(200).send(results);
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: 'SQL query failed',
                    user_message: 'Une erreur est survenue dans la lecture en base de données',
                },
            });
        }
    },
});
