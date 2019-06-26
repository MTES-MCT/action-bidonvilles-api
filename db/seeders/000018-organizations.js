module.exports = {
    up: queryInterface => queryInterface.sequelize.transaction(
        t => queryInterface.bulkInsert(
            'organization_categories',
            [
                { uid: 'national', name: 'Acteurs nationaux' },
                { uid: 'government', name: 'Services de l\'état' },
                { uid: 'local', name: 'Partenaires locaux' },
                { uid: 'ngo', name: 'Associations' },
            ],
            {
                transaction: t,
            },
        )
            .then(() => queryInterface.bulkInsert(
                'organization_types',
                [
                    {
                        uid: 'prefecture_region', name: 'Préfecture de région', full_name: null, fk_organization_category: 'government',
                    },
                    {
                        uid: 'prefecture_departement', name: 'Préfecture de département', full_name: null, fk_organization_category: 'government',
                    },
                    {
                        uid: 'ddcs', name: 'DDCS', full_name: 'Direction Départementale de la Cohésion Sociale', fk_organization_category: 'government',
                    },
                    {
                        uid: 'city', name: 'Ville', full_name: null, fk_organization_category: 'local',
                    },
                    {
                        uid: 'epci', name: 'Métropole', full_name: null, fk_organization_category: 'local',
                    },
                    {
                        uid: 'departement', name: 'Département', full_name: null, fk_organization_category: 'local',
                    },
                    {
                        uid: 'region', name: 'Région', full_name: null, fk_organization_category: 'local',
                    },
                    {
                        uid: 'dasen', name: 'DASEN', full_name: 'Direction Académique des Services de l\'Éducation Nationale', fk_organization_category: 'local',
                    },
                    {
                        uid: 'ars', name: 'ARS', full_name: 'Agence Régionale de Santé', fk_organization_category: 'local',
                    },
                    {
                        uid: 'direccte', name: 'DIRECCTE', full_name: 'Direction Régionale des Entreprises, de la Concurrence, du Travail, et de l\'Emploi', fk_organization_category: 'local',
                    },
                    {
                        uid: 'dihal', name: 'DIHAL', full_name: 'Délégation Interministérielle pour l\'Hébergement et l\'Accès au Logement', fk_organization_category: 'national',
                    },
                    {
                        uid: 'ngo', name: 'Association', full_name: null, fk_organization_category: 'ngo',
                    },
                ],
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.bulkInsert(
                'organizations',
                [
                    {
                        name: 'DIHAL',
                        fk_organization_type: 'dihal',
                        fk_region: null,
                        fk_departement: null,
                        fk_epci: null,
                        fk_city: null,
                        created_by: 1,
                    },
                ],
                {
                    transaction: t,
                },
            ))
            .then(async () => {
                const departements = await queryInterface.sequelize.query(
                    `SELECT
                        code,
                        name
                    FROM departements`,
                    {
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    },
                );

                const prefectures = departements.map(({ code, name }) => ({
                    name: `Préfecture ${name}`,
                    fk_organization_type: 'prefecture_departement',
                    fk_departement: code,
                    created_by: 1,
                }));
                const ddcs = departements.map(({ code, name }) => ({
                    name: `DDCS ${name}`,
                    fk_organization_type: 'ddcs',
                    fk_departement: code,
                    created_by: 1,
                }));
                const dep = departements.map(({ code, name }) => ({
                    name: `Département ${name}`,
                    fk_organization_type: 'departement',
                    fk_departement: code,
                    created_by: 1,
                }));

                return queryInterface.bulkInsert(
                    'organizations',
                    [
                        ...prefectures,
                        ...ddcs,
                        ...dep,
                    ],
                    {
                        transaction: t,
                    },
                );
            })
            .then(async () => {
                const regions = await queryInterface.sequelize.query(
                    `SELECT
                        code,
                        name
                    FROM regions`,
                    {
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    },
                );

                const prefectures = regions.map(({ code, name }) => ({
                    name: `Préfecture ${name}`,
                    fk_organization_type: 'prefecture_region',
                    fk_region: code,
                    created_by: 1,
                }));
                const ars = regions.map(({ code, name }) => ({
                    name: `ARS ${name}`,
                    fk_organization_type: 'ars',
                    fk_region: code,
                    created_by: 1,
                }));
                const direccte = regions.map(({ code, name }) => ({
                    name: `DIRECCTE ${name}`,
                    fk_organization_type: 'direccte',
                    fk_region: code,
                    created_by: 1,
                }));
                const reg = regions.map(({ code, name }) => ({
                    name: `Région ${name}`,
                    fk_organization_type: 'region',
                    fk_region: code,
                    created_by: 1,
                }));

                return queryInterface.bulkInsert(
                    'organizations',
                    [
                        ...prefectures,
                        ...ars,
                        ...direccte,
                        ...reg,
                    ],
                    {
                        transaction: t,
                    },
                );
            })
            .then(async () => {
                const epci = await queryInterface.sequelize.query(
                    `SELECT
                        code,
                        name
                    FROM epci`,
                    {
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    },
                );

                const rows = epci.map(({ code, name }) => ({
                    name,
                    fk_organization_type: 'epci',
                    fk_epci: code,
                    created_by: 1,
                }));

                return queryInterface.bulkInsert(
                    'organizations',
                    rows,
                    {
                        transaction: t,
                    },
                );
            })
            .catch((error) => {
                console.log(error);
                throw error;
            }),
    ),

    down: queryInterface => queryInterface.transaction(
        t => queryInterface.bulkDelete(
            'organizations',
            undefined,
            {
                transaction: t,
            },
        )
            .then(() => queryInterface.bulkDelete(
                'organization_types',
                undefined,
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.bulkDelete(
                'organization_categories',
                undefined,
                {
                    transaction: t,
                },
            )),
    ),
};
