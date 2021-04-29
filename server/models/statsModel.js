const { toFormat, getMonthDiffBetween } = require('#server/utils/date');

// Convert rows which contains month/year to a mapping
// 2020-01-01 => x, 2020-01-02 => y
function convertToDateMapping(rows, startDate) {
    const now = new Date();
    const result = [];
    const monthsDiff = getMonthDiffBetween(startDate, now);

    for (let i = 1; i <= monthsDiff; i += 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const row = rows.find(({ month, year }) => parseInt(month, 10) === date.getMonth() + 1 && year === date.getFullYear());
        result.unshift({
            month: toFormat(date, 'M Y'),
            total: row !== undefined ? row.total : 0,
        });
    }

    return result;
}

module.exports = database => ({
    numberOfPeople: async (departement) => {
        const rows = await database.query(
            `
            SELECT SUM(population_total) AS total
            FROM shantytowns 
            LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE closed_at IS NULL
            ${departement ? `AND fk_departement = '${departement}'` : ''}
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
            WHERE closed_at IS NULL
            ${departement ? `AND fk_departement = '${departement}'` : ''}
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
            WHERE closed_at IS NOT NULL
            AND closed_with_solutions='yes'
            AND shantytowns.created_at > '2019-01-01'
            ${departement ? `AND fk_departement = '${departement}'` : ''}
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },

    numberOfPlans: async (departement) => {
        const rows = await database.query(
            `
            SELECT COUNT(*) AS total 
            FROM plans2
            LEFT JOIN plan_departements on plan_departements.fk_plan = plans2.plan_id
            WHERE closed_at IS NULL
            ${departement ? `AND fk_departement = '${departement}'` : ''}
            `,
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

        return rows[0].count;
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

    numberOfOpenShantytownsAtMonth: async (departement, date = '2020-06-01') => {
        const rows = await database.query(
            `SELECT
                COUNT(*) AS total
            FROM shantytowns LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE 
                (shantytowns.created_at <= '${date}')
                AND 
                (shantytowns.closed_at >= '${date}' OR shantytowns.closed_at IS NULL)
                ${departement ? `AND fk_departement = '${departement}'` : ''}
                `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].total;
    },


    numberOfClosedShantytownsPerMonth: async (departement = null, startDateStr = '2019-06-01') => {
        const rows = await database.query(
            `SELECT 
                EXTRACT(YEAR FROM shantytowns.closed_at) AS year,
                EXTRACT(MONTH FROM shantytowns.closed_at) AS month,
                COUNT(*) AS total
            FROM shantytowns LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE
                closed_at > '${startDateStr}'
                AND closed_with_solutions != 'yes'
                ${departement ? `AND fk_departement = '${departement}'` : ''}
            GROUP BY year, month
            ORDER BY year ASC ,month ASC`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return convertToDateMapping(rows, new Date(startDateStr));
    },

    numberOfNewShantytownsPerMonth: async (departement = null, startDateStr = '2019-06-01') => {
        const rows = await database.query(
            `SELECT 
                EXTRACT(YEAR FROM shantytowns.created_at) AS year,
                EXTRACT(MONTH FROM shantytowns.created_at) AS month,
                COUNT(*) AS total
            FROM shantytowns LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE
                (shantytowns.created_at > '${startDateStr}' OR shantytowns.declared_at > '${startDateStr}')
                ${departement ? `AND fk_departement = '${departement}'` : ''}
            GROUP BY year, month
            ORDER BY year ASC, month ASC`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return convertToDateMapping(rows, new Date(startDateStr));
    },

    numberOfResorbedShantytownsPerMonth: async (departement = null, startDateStr = '2019-06-01') => {
        const rows = await database.query(
            `SELECT 
                EXTRACT(YEAR FROM shantytowns.closed_at) AS year,
                EXTRACT(MONTH FROM shantytowns.closed_at) AS month,
                COUNT(*) AS total
            FROM shantytowns LEFT JOIN cities AS city ON shantytowns.fk_city = city.code
            WHERE
                closed_at > '${startDateStr}'
                AND
                closed_with_solutions = 'yes'
                ${departement ? `AND fk_departement = '${departement}'` : ''}
            GROUP BY year, month
            ORDER BY year ASC ,month ASC`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return convertToDateMapping(rows, new Date(startDateStr));
    },

    numberOfNewUsersPerMonth: async (startDateStr = '2020-06-01') => {
        const startDate = new Date(startDateStr);
        const now = new Date();
        const limit = new Date(now.getFullYear(), now.getMonth() - 7, 1);

        const rows = await database.query(
            `SELECT
                EXTRACT(YEAR FROM ua.used_at) AS year,
                EXTRACT(MONTH FROM ua.used_at) AS month,
                COUNT(*) AS total
            FROM user_accesses ua
            WHERE
                ua.used_at IS NOT NULL
                AND
                EXTRACT(EPOCH FROM ua.used_at) >= 10000
            GROUP BY year, month
            ORDER BY year ASC,month ASC`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    limit: limit.getTime() / 1000,
                },
            },
        );

        return convertToDateMapping(rows, startDate);
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

    numberOfCreditsPerYear: async (departement) => {
        const rows = await database.query(
            `
                SELECT 
                    SUM(amount) as total, 
                    year,
                    finance_rows.fk_finance_type as type
                FROM finance_rows
                LEFT JOIN finances on finance_rows.fk_finance = finances.finance_id
                LEFT JOIN plans2 on finances.fk_plan = plans2.plan_id
                LEFT JOIN plan_departements on plan_departements.fk_plan = plans2.plan_id
                ${departement ? `WHERE fk_departement = '${departement}'` : ''}
                GROUP BY year, type
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        // transforms rows in a mapping { 2020: {[type]: total}}
        return rows.reduce((acc, obj) => ({
            ...acc,
            [obj.year]: {
                ...(acc[obj.year] || {}),
                [obj.type]: obj.total,
            },
        }), {});
    },

    averageCompletionPercentage: async (departement) => {
        const rows = await database.query(
            `SELECT
                AVG(pourcentage_completion)
            FROM
            (SELECT
                c.fk_departement,
                ((CASE WHEN (SELECT regexp_matches(s.address, '^(.+) [0-9]+ [^,]+,? [0-9]+,? [^, ]+(,.+)?$'))[1] IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN ft.label <> 'Inconnu' THEN 1 ELSE 0 END)
                +
                (CASE WHEN ot.label <> 'Inconnu' THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.census_status IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.population_total IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.population_couples IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.population_minors IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.population_total IS NOT NULL AND s.population_total >= 10 AND (SELECT COUNT(*) FROM shantytown_origins WHERE fk_shantytown = s.shantytown_id) > 0 THEN 1 ELSE 0 END)
                +
                (CASE WHEN et.label <> 'Inconnu' THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.access_to_water IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.access_to_sanitary IS NOT NULL THEN 1 ELSE 0 END)
                +
                (CASE WHEN s.trash_evacuation IS NOT NULL THEN 1 ELSE 0 END))::FLOAT / 12.0 AS pourcentage_completion
            FROM
                shantytowns s
            LEFT JOIN
                cities c ON s.fk_city = c.code
            LEFT JOIN
                field_types ft ON s.fk_field_type = ft.field_type_id
            LEFT JOIN
                owner_types ot ON s.fk_owner_type = ot.owner_type_id
            LEFT JOIN
                electricity_types et ON s.fk_electricity_type = et.electricity_type_id
            WHERE
                s.closed_at IS NULL
                ${departement ? `AND c.fk_departement = '${departement}'` : ''}
            ) AS tmp
            `,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return rows[0].avg;
    },

    numberOfReviewedComments() {
        return Promise.resolve(-1);
    },
});
