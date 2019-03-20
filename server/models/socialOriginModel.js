module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            social_origins.social_origin_id AS id,
            social_origins.label AS label
        FROM social_origins`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
