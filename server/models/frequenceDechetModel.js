module.exports = database => ({
    findAll: () => database.query(
        `SELECT
            frequence_dechets.uid AS uid,
            frequence_dechets.name AS name
        FROM frequence_dechets`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
