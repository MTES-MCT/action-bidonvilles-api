module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            plan_types.plan_type_id AS id,
            plan_types.label AS label
        FROM plan_types`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),

    findOneById: async (id) => {
        const planTypes = await database.query(
            `SELECT
                plan_types.plan_type_id AS id,
                plan_types.label AS label
            FROM plan_types
            WHERE plan_type_id = :id`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    id,
                },
            },
        );

        return planTypes.length > 0 ? planTypes[0] : null;
    },
});
