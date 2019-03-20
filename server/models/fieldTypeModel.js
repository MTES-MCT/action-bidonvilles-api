module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            field_types.field_type_id AS id,
            field_types.label AS label
        FROM field_types`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
