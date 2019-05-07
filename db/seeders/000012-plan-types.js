module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'plan_types',
        [
            { label: 'Espace temporaire d’insertion' },
            { label: 'Accompagnement social global' },
            { label: 'Intervention sanitaire' },
            { label: 'Accompagnement scolaire' },
            { label: 'Protection de l’enfance' },
            { label: 'Accompagnement emploi' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('plan_types'),
};
