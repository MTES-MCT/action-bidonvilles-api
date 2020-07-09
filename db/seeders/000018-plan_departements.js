module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.query(
            `SELECT
                p.plan_id,
                CASE
                    WHEN o.departement_code IS NOT NULL THEN o.departement_code
                    WHEN o.region_code = '52' THEN '44'
                    WHEN o.region_code = '11' THEN '94'
                    ELSE NULL
                END AS departement,
                p.created_by,
                p.created_at,
                p.updated_by,
                p.updated_at
            FROM plans2 p
            LEFT JOIN plan_managers pm ON pm.fk_plan = p.plan_id
            LEFT JOIN users u ON pm.fk_user = u.user_id
            LEFT JOIN localized_organizations o ON u.fk_organization = o.organization_id`,
            {
                type: queryInterface.sequelize.QueryTypes.SELECT,
                transaction,
            },
        )
            .then(rows => queryInterface.bulkInsert(
                'plan_departements',
                rows.map(({
                    plan_id, departement, created_by, created_at, updated_by, updated_at,
                }) => ({
                    fk_plan: plan_id,
                    fk_departement: departement,
                    created_by,
                    created_at,
                    updated_by,
                    updated_at,
                })),
                {
                    transaction,
                },
            )),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkDelete(
            'plan_departements',
            {
                transaction,
            },
        ),
    ),

};
