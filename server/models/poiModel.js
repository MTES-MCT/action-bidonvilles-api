module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            *
        FROM pois
        WHERE 
            'Distribution Alimentaire'=ANY(categories) OR
            'Colis Alimentaire'=ANY(categories)`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
