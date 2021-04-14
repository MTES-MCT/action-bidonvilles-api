const { backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.11.10',
    date: new Date(2021, 1, 25),
    items: [
        {
            title: 'Fiches Covid-19 actualisées de la DGCS',
            description: '<p>Retrouvez dans l\'espace Covid, les fiches de la Direction Générale de la Cohésion sociale avec les dernières mesures pour les intervenants auprès des personnes en bidonvilles ou squat et les services d\'hébergement ou de logement.</p>',
            image: `${backUrl}/assets/changelog/0.11.10/item_1.png`,
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
