module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            action_types.action_type_id AS id,
            action_types.label AS label
        FROM action_types`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
