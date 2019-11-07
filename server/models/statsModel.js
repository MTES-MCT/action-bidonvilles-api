const { toFormat } = require('#server/utils/date');

module.exports = database => ({
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

    numberOfNewUsersLastMonth: async () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthBefore = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        const promises = [
            database.query(
                `SELECT
                    COUNT(*) AS total
                FROM users
                WHERE
                    users.activated_on IS NOT NULL
                    AND
                    EXTRACT(MONTH FROM users.activated_on) = :month
                    AND
                    EXTRACT(YEAR FROM users.activated_on) = :year
                `,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        month: lastMonth.getMonth() + 1,
                        year: lastMonth.getFullYear(),
                    },
                },
            ),
            database.query(
                `SELECT
                    COUNT(*) AS total
                FROM users
                WHERE
                    users.activated_on IS NOT NULL
                    AND
                    EXTRACT(MONTH FROM users.activated_on) = :month
                    AND
                    EXTRACT(YEAR FROM users.activated_on) = :year
                `,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        month: monthBefore.getMonth() + 1,
                        year: monthBefore.getFullYear(),
                    },
                },
            ),
        ];

        const [lastMonthRows, monthBeforeRows] = await Promise.all(promises);

        return {
            month: toFormat(lastMonth, 'M Y'),
            total: lastMonthRows[0].total,
            diff: monthBeforeRows[0].total > 0 ? (lastMonthRows[0].total - monthBeforeRows[0].total) / monthBeforeRows[0].total : '-',
        };
    },

    numberOfCollaboratorAndAssociationUsers: async () => {
        const rows = await database.query(
            `SELECT
                COUNT(*) AS total
            FROM users
            LEFT JOIN localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
            LEFT JOIN organization_types ON organizations.fk_type = organization_types.organization_type_id
            WHERE
                users.fk_status='active'
                AND
                organizations.active = TRUE
                AND
                organization_types.fk_category IN ('territorial_collectivity', 'association', 'public_establishment')
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
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
                organization_types.fk_category IN ('territorial_collectivity', 'association', 'public_establishment')
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

    numberOfExports() {
        return Promise.resolve(-1);
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

    numberOfDirectoryViews() {
        return Promise.resolve(-1);
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
