module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.query(
            `SELECT
                *
                FROM
                (
                    SELECT
                        plan_managers.fk_plan,
                        COALESCE(departement_code, departements.code) AS fk_departement
                    FROM
                        plan_managers
                    LEFT JOIN users ON plan_managers.fk_user = users.user_id
                    LEFT JOIN localized_organizations ON users.fk_organization = localized_organizations.organization_id
                    LEFT JOIN departements ON departements.fk_region = localized_organizations.region_code
                ) t
                GROUP BY fk_plan, fk_departement
            `,
            {
                type: queryInterface.sequelize.QueryTypes.SELECT,
            },
        )
            .then((rows) => {
                queryInterface.bulkInsert(
                    'plan_territories',
                    rows,
                    {
                        transaction,
                    },
                );
            }),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkDelete('plan_territories', undefined, {
            transaction,
        }),
    ),

};
