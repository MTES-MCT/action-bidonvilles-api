const url = require('url');
const { sequelize } = require('../../db/models');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = {
    async searchCities(req, res) {
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
                    cities.code,
                    cities.name,
                    departements.code AS departement
                FROM
                    cities
                LEFT JOIN
                    epci ON cities.fk_epci = epci.code
                LEFT JOIN
                    departements ON epci.fk_departement = departements.code
                WHERE
                    REPLACE(cities.name, '-', ' ') ILIKE REPLACE(?, '-', ' ')
                ORDER BY
                    CASE
                        WHEN REPLACE(cities.name, '-', ' ') ILIKE REPLACE(?, '-', ' ') THEN 1
                        ELSE 2
                    END,
                    cities.name ASC
                LIMIT 20`,
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

    async searchEpci(req, res) {
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
                    epci.code,
                    epci.name,
                    departements.code AS departement
                FROM
                    epci
                LEFT JOIN
                    departements ON epci.fk_departement = departements.code
                WHERE
                    REPLACE(epci.name, '-', ' ') ILIKE REPLACE(?, '-', ' ')
                ORDER BY
                    CASE
                        WHEN REPLACE(epci.name, '-', ' ') ILIKE REPLACE(?, '-', ' ') THEN 1
                        ELSE 2
                    END,
                    epci.name ASC
                LIMIT 20`,
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
};
