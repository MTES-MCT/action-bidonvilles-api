const { frontUrl, backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.0.75',
    date: new Date(2019, 9, 1),
    items: [
        {
            title: 'Mise en place des accès différenciés pour les différents types d\'utilisateurs',
            description: `<p>À chaque acteur, ses droits d'accès.</p><p>Tout acteur de la résorption des bidonvilles peut effectuer une demande d'accès. Désormais, l'administrateur local identifié parmi les correspondants valide et paramètre l'accès du nouvel utilisateur.</p><p><a href="${frontUrl}/typologie-des-acces" target="_blank">Guide des accès et de l'administrateur</a></p>`,
            image: `${backUrl}/assets/changelog/0.0.75/item_1.jpg`,
        },
        {
            title: 'Amélioration de l\'affichage de la liste de sites',
            description: '<p>Le tableau récapitulatif des sites a été optimisé pour mieux visualiser la situation. Vous pouvez le retrouver dans l\'onglet site.</p>',
            image: `${backUrl}/assets/changelog/0.0.75/item_2.jpg`,
        },
        {
            title: 'Amélioration de l\'export d\'un tableau Excel lisible et exploitable',
            description: '<p>Vous pouvez plus facilement exploiter les données grâce à l\'optimisation de la fonctionnalité d\'export des sites. Les sites fermés et ouverts ont été différenciés pour un suivi plus adapté. L\'export s\'effectue depuis la liste des sites.</p>',
            image: `${backUrl}/assets/changelog/0.0.75/item_3.jpg`,
        },
        {
            title: 'Mise en place d\'un annuaire des partenaires des actions de résorption',
            description: '<p>Un annuaire avec l\'ensemble des utilisateurs est disponible depuis le menu principal.</p>',
            image: `${backUrl}/assets/changelog/0.0.75/item_4.jpg`,
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
