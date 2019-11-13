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
    findOne: async (id) => {
        const rows = await database.query(
            `SELECT
                owner_types.owner_type_id AS id,
                owner_types.label AS label
            FROM owner_types
            WHERE owner_types.owner_type_id = :id`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    id,
                },
            },
        );

        if (rows.length !== 1) {
            return null;
        }

        return rows[0];
    },
});
