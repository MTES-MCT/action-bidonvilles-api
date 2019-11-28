module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkInsert(
            'frequence_dechets',
            [
                {
                    uid: 'daily',
                    name: 'Tous les jours',
                },
                {
                    uid: 'regularly',
                    name: 'Plusieurs fois par semaine',
                },
                {
                    uid: 'weekly',
                    name: 'Une fois par semaine',
                },
                {
                    uid: 'irregularly',
                    name: 'Moins d\'une fois par semaine',
                },
            ],
            {
                transaction,
            },
        ),
    ),

    down: queryInterface => queryInterface.bulkDelete('frequence_dechets'),

};
