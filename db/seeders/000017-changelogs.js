const { frontUrl, backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.2.0',
    date: new Date(2020, 1, 3),
    items: [
        {
            title: 'Vous pouvez renseigner les dispositifs existants en 2019 et leurs résultats jusqu\'au 21/02/2020',
            description: '<p><ul><li>Le <strong>service de l’Etat</strong> en charge du pilotage d’un ou plusieurs dispositifs en déclare l’existence.</li><li>L’<strong>opérateur associatif</strong> qui intervient renseigne les indicateurs de suivi présents sur la plateforme.</li></ul></p><p>Nous vous invitons désormais à mettre à jour au fil de l’eau ces informations.</p>',
            image: `${backUrl}/assets/changelog/0.2.0/item_1.png`,
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
