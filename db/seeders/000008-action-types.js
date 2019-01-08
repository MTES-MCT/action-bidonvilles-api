module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'action_types',
        [
            { label: 'Évaluation sociale' },
            { label: 'Accompagnement social global' },
            { label: 'Intervention sanitaire' },
            { label: 'Accompagnement spécifique scolarisation' },
            { label: 'Action spécifique « protection de l’enfance/ lutte contre la délinquance » ' },
            { label: 'Intervention association ou collectif bénévole' },
            { label: 'Autre (préciser)' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('action_types'),
};
