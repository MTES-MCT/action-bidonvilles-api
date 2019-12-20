const { frontUrl, backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.1.1',
    date: new Date(2019, 12, 12),
    items: [
        {
            title: 'De nombreuses demandes d\'accès sont en attente sur la plateforme',
            description: `<p><strong>Pour les administrateurs locaux, il convient d'accepter ou de refuser les accès des partenaires dans des délais rapides.</strong></p><p>vous pouvez suivre les demandes en cours depuis l'onglet ADMINISTRATION de la plateforme.</p><p><a href="${frontUrl}/typologie-des-acces" target="_blank">Guide des accès et de l'administrateur</a></p><p><a href="${frontUrl}/charte-d-engagement" target="_blank">Charte d'engagement des utilisateurs</a></p>`,
            image: `${backUrl}/assets/changelog/0.1.1/item_1.png`,
        },
        {
            title: 'Des mises à jour par les responsables du suivi des sites sont attendues',
            description: '<p><strong>Pour les personnes en charge du suivi des sites, il convient de mettre à jour la plateforme.</strong></p><p>Deux fois par an, la Dihal réalise un état des lieux national des bidonvilles, campements et squats. La Dihal va réaliser un nouvel état des lieux à la date de référence 31/12/2019 à partir des données de la plateforme.</p><p><strong>Nous vous demandons donc de réaliser les mises à jour nécessaires, et ce jusqu\'au mercredi 15/01/2020 soir.</strong></p>',
            image: `${backUrl}/assets/changelog/0.1.1/item_2.png`,
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
