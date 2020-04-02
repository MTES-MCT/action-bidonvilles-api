const { frontUrl, backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.6.0',
    date: new Date(2020, 4, 30),
    items: [
        {
            title: 'Ajout des champs “modalités d’accès à l’eau” et “modalités d’accès à l’électricité”',
            description: '<p>pour préciser la situation de l’accès à ces fluides de première nécessité.</p>',
            image: `${backUrl}/assets/changelog/0.6.0/item_1.jpg`,
        },
        {
            title: 'Mise en place d’un filtre « accès à l’eau »',
            description: '<p>sur la cartographie, pour visualiser plus facilement les sites qui n’ont pas accès à l’eau.</p>',
            image: `${backUrl}/assets/changelog/0.6.0/item_2.jpg`,
        },
        {
            title: 'Création d’un espace « commentaires Covid-19 »',
            description: '<p>ouvert et visible par tous les utilisateurs du département, pour connaître, partager et suivre les interventions réalisées sur un site.</p>',
            image: `${backUrl}/assets/changelog/0.6.0/item_3.jpg`,
        },
        {
            title: 'Développement d’un onglet « Covid-19 »',
            description: '<p>pour visualiser l’ensemble des commentaires “sites” et ajouter des commentaires plus généraux sur l’organisation du territoire.</p>',
            image: `${backUrl}/assets/changelog/0.6.0/item_4.jpg`,
        },
        {
            title: '',
            description: '<p>Ces nouveautés ont été mise en ligne pour faciliter la gestion et le suivi du Covid-19 dans les territoires. Tous les détails des fonctionnalités sur cette <a href="https://www.youtube.com/watch?v=IoOQsFE50ew" target="_blank">vidéo</a>.</p>',
            image: `${backUrl}/assets/changelog/0.6.0/item_5.jpg`,
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
