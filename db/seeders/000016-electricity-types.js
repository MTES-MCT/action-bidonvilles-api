module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'electricity_types',
        [
            { label: 'Inconnu' },
            { label: 'Non' },
            { label: 'Oui' },
            { label: 'Oui (accès régulier)' },
            { label: 'Oui (accès irrégulier)' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('electricity_types'),
};
