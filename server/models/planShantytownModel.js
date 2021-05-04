/**
 * Serializes a single planShantytown row
 *
 * @param {Object} planShantytown
 *
 * @returns {Object}
 */
function serializePlan(planShantytown) {
    return {
        plan_id: planShantytown.plan_id,
        shantytown_id: planShantytown.shantytown_id,
        name: planShantytown.plan_name,
        goals: planShantytown.plan_goals,
        category: planShantytown.plan_category,
        operator: {
            name: planShantytown.org_name,
            abbreviation: planShantytown.org_abbreviation,
            id: planShantytown.org_id,
        },
    };
}

module.exports = database => ({
    serializePlan,

    findAll(shantytownIds, transaction = undefined) {
        const ids = Array.isArray(shantytownIds) ? shantytownIds : [shantytownIds];

        return database.query(
            `SELECT 
                ps.fk_plan as plan_id,
                ps.fk_shantytown as shantytown_id,
                plans2.name as plan_name,
                plans2.goals as plan_goals,
                plans2.fk_category as plan_category,
                organizations.organization_id as org_id,
                organizations.name as org_name,
                organizations.abbreviation as org_abbreviation
            FROM plan_shantytowns ps
            LEFT JOIN plans2 on plans2.plan_id = ps.fk_plan
            LEFT JOIN plan_operators ON plan_operators.fk_plan = ps.fk_plan
            LEFT JOIN users on users.user_id = plan_operators.fk_user
            LEFT JOIN organizations on organizations.organization_id = users.fk_organization
            WHERE ps.fk_shantytown in (:ids)`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    ids,
                },
                transaction,
            },
        );
    },
});
