/**
 * Serializes a single electricity-type row
 *
 * @param {Object} electricityType
 *
 * @returns {Object}
 */
function serializeElectricityType(electricityType) {
    return {
        id: electricityType.id,
        label: electricityType.label,
        position: electricityType.position,
    };
}

module.exports = database => ({
    findAll: async () => {
        const electricityTypes = await database.query(
            `SELECT
                electricity_types.electricity_type_id AS id,
                electricity_types.label AS label,
                electricity_types.position AS position
            FROM electricity_types
            ORDER BY position ASC`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return electricityTypes.map(serializeElectricityType);
    },
});
