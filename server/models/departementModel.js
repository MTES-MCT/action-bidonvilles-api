module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            departements.code AS code,
            departements.name AS name
        FROM departements`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
