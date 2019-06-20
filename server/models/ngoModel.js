module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            ngos.ngo_id AS id,
            ngos.name AS name
        FROM ngos`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),

    findOneById: async (id) => {
        const ngo = await database.query(
            `SELECT
                ngos.ngo_id AS id,
                ngos.name AS name
            FROM ngos
            WHERE ngo_id = :id`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    id,
                },
            },
        );

        if (ngo.length === 0) {
            return null;
        }

        return ngo[0];
    },

    findOneByName: async (name) => {
        const ngo = await database.query(
            `SELECT
                ngos.ngo_id AS id,
                ngos.name AS name
            FROM ngos
            WHERE name = :name`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    name,
                },
            },
        );

        if (ngo.length === 0) {
            return null;
        }

        return ngo[0];
    },

    create: (data, creatorId) => database.query(
        'INSERT INTO ngos(name, created_by, updated_by) VALUES (:name, :id, :id) RETURNING ngo_id',
        {
            replacements: {
                name: data.name,
                id: creatorId,
            },
        },
    ),
});
