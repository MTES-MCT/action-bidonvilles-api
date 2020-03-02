const { frontUrl, backUrl } = require('../../server/config');

const changelog = {
    app_version: '0.3.3',
    date: new Date(2020, 2, 2),
    items: [
        {
            title: 'Recommandations à destination des services en charge du pilotage de la résorption des bidonvilles et des associations y intervenant',
            description: `<p>Vous trouverez ci-dessous une fiche présentant les <strong>préconisations officielles du ministère de la santé pour les professionnels, personnes accompagnées et proches.</strong> Elle a été transmise aux fédérations et associations gestionnaires qui accueillent des personnes sans domicile.</p><p>Concernant le public en bidonvilles, nous vous recommandons une attention particulière, notamment :<ul><li>relayer les mesures de sensibilisation, d’information et d’orientation des personnes vulnérables auprès de vos partenaires et des habitants des bidonvilles, en lien avec les services de préfecture et les agences régionales de santé</li><li>assurer une intervention renforcée des équipe d’intervention sociale et de médiation sanitaire sur les sites</li><li>mobiliser lorsque nécessaire, des supports traduits des recommandations destinées au grand public, de même que des services d’interprétariat</li></ul></p><p>En cas de question, merci d’interroger rapidement la <strong>cellule de crise Covid19 de la DGCS</strong> à l’adresse suivante : dgcs-alerte-covid@social.gouv.fr</p><p>Merci de transmettre à la Dihal toute information utile, y compris des documents traduits que vous diffuseriez.</p><p><a href="${backUrl}/assets/informations-nouveau-coronavirus.pdf" target="_blank">Informations, et recommandations sur le nouveau Coronavirus</a></p>`,
            image: `${backUrl}/assets/changelog/0.3.3/item_1.png`,
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
