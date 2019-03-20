module.exports = randomStr => [
    {
        table: 'regions',
        rows: [
            {
                code: '11',
                name: 'Île-de-France',
            },
        ],
    },
    {
        table: 'departements',
        rows: [
            {
                code: '75',
                name: 'Paris',
                latitude: 25,
                longitude: 10,
                fk_region: '11',
            },
        ],
    },
    {
        table: 'epci',
        rows: [
            {
                code: '200054781',
                name: 'Métropole du Grand Paris',
            },
        ],
    },
    {
        table: 'cities',
        rows: [
            {
                code: '75056',
                name: 'Paris',
                fk_epci: '200054781',
                fk_departement: '75',
            },
        ],
    },
    {
        table: 'roles',
        rows: [
            {
                name: 'superadmin',
            },
        ],
    },
    {
        table: 'permissions',
        rows: [
            {
                type: 'feature',
                name: 'createTown',
            },
            {
                type: 'feature',
                name: 'updateTown',
            },
            {
                type: 'feature',
                name: 'deleteTown',
            },
            {
                type: 'feature',
                name: 'createComment',
            },
            {
                type: 'feature',
                name: 'updateComment',
            },
            {
                type: 'feature',
                name: 'deleteComment',
            },
        ],
    },
    {
        table: 'role_permissions',
        rows: [
            { fk_role: 1, fk_permission: 1 },
            { fk_role: 1, fk_permission: 2 },
            { fk_role: 1, fk_permission: 3 },
            { fk_role: 1, fk_permission: 4 },
            { fk_role: 1, fk_permission: 5 },
            { fk_role: 1, fk_permission: 6 },
        ],
    },
    {
        table: 'users',
        rows: [
            {
                email: randomStr,
                password: randomStr,
                salt: randomStr,
                fk_departement: '75',
                first_name: randomStr,
                last_name: randomStr,
                company: randomStr,
                fk_role: 1,
            },
        ],
    },
    {
        table: 'field_types',
        rows: [
            {
                label: 'Inconnu',
            },
            {
                label: 'Immeuble bâti',
            },
        ],
    },
    {
        table: 'owner_types',
        rows: [
            {
                label: 'Inconnu',
            },
            {
                label: 'Public',
            },
        ],
    },
    {
        table: 'social_origins',
        rows: [
            {
                label: 'Ressortissants français',
            },
            {
                label: 'Ressortissants européens',
            },
        ],
    },
    {
        table: 'closing_solutions',
        rows: [
            {
                label: 'Whatever 1',
            },
            {
                label: 'Whatever 2',
            },
        ],
    },
];
