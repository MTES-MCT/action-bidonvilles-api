module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'funding_types',
        [
            { label: 'Financements étatiques hors crédits dédiés' },
            { label: 'Crédits dédiés à la résorption des bidonvilles' },
            { label: 'Cofinancement collectivité territoriale' },
            { label: 'Financement européen' },
            { label: 'Financement privé' },
            { label: 'Autre' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('funding_types'),
};
