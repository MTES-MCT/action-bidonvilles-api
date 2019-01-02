module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'field_types',
            [
                { label: 'Inconnu' },
                { label: 'Immeuble bâti' },
                { label: 'Terrain' },
            ],
        );
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('field_types');
    },
};
