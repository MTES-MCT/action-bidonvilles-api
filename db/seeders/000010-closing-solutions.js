module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'closing_solutions',
        [
            { label: 'Mise à l’abri / hébergement d’urgence (CHU)' },
            { label: 'Hébergement d’insertion (CHRS, ALT)' },
            { label: 'Logement ordinaire ou adapté (résidences sociales, IML, pensions de famille, logements social ou privé accompagnés)' },
            { label: 'Dispositif dédié (CADA, HUDA, CAO, CHUM, ARV, ...)' },
            { label: 'Dispositif spécifique d’insertion au territoire' },
            { label: 'Dispositifs de veille sociale ou sans solution' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('closing_solutions'),
};
