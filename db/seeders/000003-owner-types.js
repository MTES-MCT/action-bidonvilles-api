module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'owner_types',
            [
                { label: 'Inconnu' },
                { label: 'Public' },
                { label: 'Privé' },
            ],
        );
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('owner_types');
    },
};
