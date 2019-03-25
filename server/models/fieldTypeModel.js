/**
 * Serializes a single field-type row
 *
 * @param {Object} fieldType
 *
 * @returns {Object}
 */
function serializeFieldType(fieldType) {
    return {
        id: fieldType.id,
        label: fieldType.label,
        color: `#${fieldType.color}`,
    };
}

module.exports = database => ({
    findAll: async () => {
        const fieldTypes = await database.query(
            `SELECT
                field_types.field_type_id AS id,
                field_types.label AS label,
                field_types.color AS color
            FROM field_types`,
            {
                type: database.QueryTypes.SELECT,
            },
        );

        return fieldTypes.map(serializeFieldType);
    },
});
