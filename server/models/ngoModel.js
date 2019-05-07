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
