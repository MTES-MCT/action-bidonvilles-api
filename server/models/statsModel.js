const { toFormat } = require('#server/utils/date');

module.exports = database => ({
    numberOfPeople: async (departement) => {
        const rows = await database.query(
            `
            SELECT SUM(population_total) AS total
            FROM shantytowns 
            LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            ${departement ? `WHERE fk_departement = '${departement}'` : ''}
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfShantytown: async (departement) => {
        const rows = await database.query(
            `
            SELECT COUNT(*) AS total 
            FROM shantytowns 
            LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            ${departement ? `WHERE fk_departement = '${departement}'` : ''}
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfResorbedShantytown: async (departement) => {
        const rows = await database.query(
            `
            SELECT COUNT(*) AS total
            FROM shantytowns 
            LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE closed_with_solutions = 'yes'
            ${departement ? `AND fk_departement = '${departement}'` : ''}
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    // TODO: Not sure how to filter on departement
    numberOfPlans: async () => {
        const rows = await database.query(
            'SELECT COUNT(*) AS total FROM plans2',
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfUsers: async (departement) => {
        const rows = await database.query(
            `
            SELECT COUNT(*) from users
            LEFT JOIN organizations on users.fk_organization = organizations.organization_id
            WHERE fk_status = 'active'
            ${departement ? `AND fk_departement = '${departement}'` : ''}
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },


    numberOfDepartements: async () => {
        const rows = await database.query(
            `SELECT
                    COUNT(*) AS total
                FROM (
                    SELECT
                        organizations.departement_code
                    FROM users
                    LEFT JOIN localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
                    WHERE
                        users.fk_status='active'
                        AND
                        organizations.active = TRUE
                    GROUP BY organizations.departement_code
                ) t`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfActiveUsers: async () => {
        const rows = await database.query(
            `SELECT
                COUNT(*) AS total
            FROM users
            LEFT JOIN localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
            WHERE
                users.fk_status='active'
                AND
                organizations.active = TRUE
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfUsersAtMonth: async (date = '2020-06-01') => {
        const rows = await database.query(
            `SELECT
                COUNT(*) AS total
                FROM user_accesses ua
            WHERE 
                ua.used_at IS NOT NULL
                AND
                ua.used_at < '${date}'`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfNewUsersPerMonth: async (startDateStr = '2020-06-01') => {
        const startDate = new Date(startDateStr);
        const now = new Date();
        const limit = new Date(now.getFullYear(), now.getMonth() - 7, 1);

        const rows = await database.query(
            `SELECT
                EXTRACT(MONTH FROM ua.used_at) AS month,
                COUNT(*) AS total
            FROM user_accesses ua
            WHERE
                ua.used_at IS NOT NULL
                AND
                EXTRACT(EPOCH FROM ua.used_at) >= 10000
            GROUP BY EXTRACT(MONTH FROM ua.used_at)
            ORDER BY month asc`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    limit: limit.getTime() / 1000,
                },
            },
        );

        const result = [];
        const monthsDiff = (now.getMonth() - startDate.getMonth()) + (now.getFullYear() - startDate.getFullYear()) * 12;

        for (let i = 1; i <= monthsDiff; i += 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const row = rows.find(({ month }) => parseInt(month, 10) === date.getMonth() + 1);
            result.unshift({
                month: toFormat(date, 'M Y'),
                total: row !== undefined ? row.total : 0,
            });
        }

        return result;
    },

    numberOfCollaboratorAndAssociationUsers: async () => {
        const rows = await database.query(
            `SELECT
                organization_types.fk_category,
                COUNT(*) AS total
            FROM users
            LEFT JOIN localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
            LEFT JOIN organization_types ON organizations.fk_type = organization_types.organization_type_id
            WHERE
                users.fk_status='active'
                AND
                organizations.active = TRUE
                AND
                organization_types.fk_category IN ('territorial_collectivity', 'association', 'public_establishment', 'administration')
            GROUP BY organization_types.fk_category    
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows.reduce((hash, row) => Object.assign({}, hash, {
            [row.fk_category]: row.total,
        }), {});
    },

    numberOfCollaboratorAndAssociationOrganizations: async () => {
        const rows = await database.query(
            `SELECT
                organization_types.fk_category,
                COUNT(DISTINCT users.fk_organization) AS total
            FROM users
            LEFT JOIN localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
            LEFT JOIN organization_types ON organizations.fk_type = organization_types.organization_type_id
            WHERE
                users.fk_status='active'
                AND
                organizations.active = TRUE
                AND
                organization_types.fk_category IN ('territorial_collectivity', 'association', 'public_establishment', 'administration')
            GROUP BY organization_types.fk_category`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows.reduce((hash, row) => Object.assign({}, hash, {
            [row.fk_category]: row.total,
        }), {});
    },

    numberOfShantytownOperations: async () => {
        const promises = [
            database.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM shantytowns
                LEFT JOIN users ON shantytowns.created_by = users.user_id
                LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
                LEFT JOIN cities ON shantytowns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    organizations.abbreviation <> 'DIHAL'
                    OR
                    organizations.abbreviation IS NULL
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: database.QueryTypes.SELECT,
                },
            ),
            database.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM (
                    SELECT
                        shantytown_id,
                        fk_city,
                        COALESCE(updated_by, created_by) AS updated_by
                    FROM "ShantytownHistories"
                    WHERE updated_by IS NOT NULL OR created_by IS NOT NULL
                ) AS "towns"
                LEFT JOIN users ON towns.updated_by = users.user_id
                LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
                LEFT JOIN cities ON towns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    organizations.abbreviation <> 'DIHAL'
                    OR
                    organizations.abbreviation IS NULL
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: database.QueryTypes.SELECT,
                },
            ),
            database.query(
                `SELECT
                    COUNT(*) AS total,
                    departements.code,
                    departements.name
                FROM
                    (SELECT
                        shantytowns.fk_city,
                        COALESCE(h1.updated_by, shantytowns.updated_by) AS updated_by
                    FROM shantytowns
                    LEFT JOIN "ShantytownHistories" h1 ON h1.hid = (
                        SELECT
                            hid
                        FROM
                            "ShantytownHistories" h2
                        WHERE
                            h2.shantytown_id = shantytowns.shantytown_id
                            AND
                            h2.closed_at = shantytowns.closed_at
                        ORDER BY h2."archivedAt" ASC
                        LIMIT 1
                    )
                    WHERE shantytowns.closed_at IS NOT NULL) towns
                LEFT JOIN users ON towns.updated_by = users.user_id
                LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
                LEFT JOIN cities ON towns.fk_city = cities.code
                LEFT JOIN departements ON cities.fk_departement = departements.code
                WHERE
                    organizations.abbreviation <> 'DIHAL'
                    OR
                    organizations.abbreviation IS NULL
                GROUP BY departements.code, departements.name
                ORDER BY departements.code ASC`,
                {
                    type: database.QueryTypes.SELECT,
                },
            ),
        ];

        const [creations, updates, closings] = await Promise.all(promises);

        return {
            creations,
            updates,
            closings,
        };
    },

    numberOfComments: async () => {
        const rows = await database.query(
            'SELECT COUNT(*) AS total FROM shantytown_comments',
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    meanTimeBeforeCreationDeclaration: async () => {
        const rows = await database.query(
            `SELECT
                AVG(diff) AS average,
                percentile_disc(0.5) within group (ORDER BY diff) AS median
            FROM
                (SELECT
                    COALESCE(built_at, declared_at) AS d,
                    EXTRACT(day from created_at - COALESCE(built_at, declared_at)) AS diff
                FROM shantytowns
                WHERE built_at IS NOT NULL OR declared_at IS NOT NULL) t
            WHERE
                d >= '2019-09-01'::date /* date of official opening to actual users */
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0];
    },

    meanTimeBeforeClosingDeclaration: async () => {
        const rows = await database.query(
            `SELECT
                AVG(diff) AS average,
                percentile_disc(0.5) within group (ORDER BY diff) AS median
            FROM (SELECT
                    shantytowns.closed_at AS d,
                    EXTRACT(days from COALESCE(h1."archivedAt", shantytowns.updated_at) - shantytowns.closed_at) AS diff
                FROM shantytowns
                LEFT JOIN "ShantytownHistories" h1 ON h1.hid = (
                    SELECT
                        hid
                    FROM
                        "ShantytownHistories" h2
                    WHERE
                        h2.shantytown_id = shantytowns.shantytown_id
                        AND
                        h2.closed_at = shantytowns.closed_at
                    ORDER BY h2."archivedAt" ASC
                    LIMIT 1
                )
                WHERE shantytowns.closed_at IS NOT NULL
            ) t
            WHERE
                d >= '2019-09-01'::date /* date of official opening to actual users */
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0];
    },

    numberOfReviewedComments() {
        return Promise.resolve(-1);
    },
});
