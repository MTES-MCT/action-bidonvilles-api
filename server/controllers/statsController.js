const { sequelize } = require('#db/models');

module.exports = () => ({
    all: async (req, res) => {
        const [creations, editions, closures] = await Promise.all([
            sequelize.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM shantytowns
                LEFT JOIN users ON shantytowns.created_by = users.user_id
                LEFT JOIN cities ON shantytowns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    users.email NOT LIKE '%dihal%'
                    AND
                    users.email NOT LIKE '%beta.gouv%'
                    AND
                    users.email <> 'sophie.jacquemont@developpement-durable.gouv.fr'
                    AND
                    users.email <> 'dubuc.laure@gmail.com'
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                },
            ),
            sequelize.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM (
                    SELECT shantytown_id, fk_city, created_by, created_at, updated_by, updated_at FROM "shantytowns" WHERE updated_at <> created_at
                    UNION
                    SELECT shantytown_id, fk_city, created_by, created_at, updated_by, updated_at FROM "ShantytownHistories" WHERE updated_at <> created_at
                ) AS "towns"
                LEFT JOIN users ON towns.updated_by = users.user_id
                LEFT JOIN cities ON towns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    users.email NOT LIKE '%dihal%'
                    AND
                    users.email NOT LIKE '%beta.gouv%'
                    AND
                    users.email <> 'sophie.jacquemont@developpement-durable.gouv.fr'
                    AND
                    users.email <> 'dubuc.laure@gmail.com'
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                },
            ),
            sequelize.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM shantytowns
                LEFT JOIN users ON shantytowns.updated_by = users.user_id
                LEFT JOIN cities ON shantytowns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    users.email NOT LIKE '%dihal%'
                    AND
                    users.email NOT LIKE '%beta.gouv%'
                    AND
                    users.email <> 'sophie.jacquemont@developpement-durable.gouv.fr'
                    AND
                    users.email <> 'dubuc.laure@gmail.com'
                    AND
                    shantytowns.closed_at IS NOT NULL
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: sequelize.QueryTypes.SELECT,
                },
            ),
        ]);

        return res.status(200).send({
            success: true,
            response: {
                statistics: {
                    created: creations,
                    updated: editions,
                    closed: closures,
                },
            },
        });
    },
});
