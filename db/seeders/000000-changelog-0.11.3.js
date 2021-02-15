const { backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.11.3',
    date: new Date(2021, 1, 1),
    items: [
        {
            title: 'Résorption-bidonvilles améliore la localisation des sites !',
            description: '<p><strong>Partagez les coordonnées GPS d’un site pour permettre aux intervenants de votre communauté de s’y rendre facilement !</strong> Rendez également vos cartographies plus précises avec cette nouvelle donnée.</p>',
            image: `${backUrl}/assets/changelog/0.11.3/item_1.png`,
        },
    ],
};

module.exports = {
    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkInsert(
            'changelogs',
            [{
                app_version: changelog.app_version,
                date: changelog.date,
            }],
            {
                transaction,
            },
        )
            .then(() => queryInterface.bulkInsert(
                'changelog_items',
                changelog.items.map(({ title, description, image }, position) => ({
                    title,
                    description,
                    image,
                    position,
                    fk_changelog: changelog.app_version,
                })),
                {
                    transaction,
                },
            )),
    ),

    down: queryInterface => queryInterface.bulkDelete(
        'changelogs',
        {
            app_version: changelog.app_version,
        },
    ),
};
