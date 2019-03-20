module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            owner_types.owner_type_id AS id,
            owner_types.label AS label
        FROM owner_types`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
