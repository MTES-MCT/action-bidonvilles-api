module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            *
        FROM poi`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
