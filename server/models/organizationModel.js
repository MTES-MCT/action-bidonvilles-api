module.exports = database => ({
    findAll: async () => database.query(
        'SELECT * FROM organizations_full',
        {
            type: database.QueryTypes.SELECT,
        },
    ),

    findOneById: async (id) => {
        const organization = await database.query(
            `SELECT
                *
            FROM organizations_full
            WHERE organization_id = :id`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    id,
                },
            },
        );

        if (organization.length === 0) {
            return null;
        }

        return organization[0];
    },
});
