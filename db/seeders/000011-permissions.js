module.exports = {
    up: (queryInterface) => {
        const permissionsToInsert = {
            data: [
                'priority',
                'declaredAt',
                'builtAt',
                'closedAt',
                'address',
                'addressDetails',
                'populationTotal',
                'populationCouples',
                'populationMinors',
                'accessToElectricity',
                'accessToWater',
                'trashEvacuation',
                'owner',
                'censusStatus',
                'censusConductedBy',
                'censusConductedAt',
                'ownerComplaint',
                'justiceProcedure',
                'justiceRendered',
                'justiceRenderedAt',
                'justiceRenderedBy',
                'justiceChallenged',
                'policeStatus',
                'policeRequestedAt',
                'policeGrantedAt',
                'bailiff',
                'socialOrigins',
                'comments',
                'closingSolutions',
                'city',
                'epci',
                'departement',
                'fieldType',
                'ownerType',
                'actions',
                'updatedAt',
            ],
        };

        const promises = [];
        Object.keys(permissionsToInsert).forEach((type) => {
            promises.push(
                queryInterface.sequelize.query(
                    `INSERT INTO permissions(type, name) VALUES ${permissionsToInsert[type].map((name, index) => `(:type, :name${index})`).join(',')}`,
                    {
                        replacements: permissionsToInsert[type].reduce((obj, name, index) => Object.assign(obj, {
                            [`name${index}`]: name,
                        }), { type }),
                    },
                ),
            );
        });

        return Promise.all(promises)
            .then(() => Promise.all([
                queryInterface.sequelize.query(
                    'SELECT roles.role_id, roles.name FROM roles',
                    {
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    },
                ),
                queryInterface.sequelize.query(
                    'SELECT permissions.permission_id, permissions.type, permissions.name FROM permissions',
                    {
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    },
                ),
            ]))
            .then(([roles, permissions]) => {
                const hash = {
                    roles: roles.reduce((obj, { role_id, name }) => Object.assign(obj, { [name]: role_id }), {}),
                    permissions: permissions.reduce((obj, { permission_id, type, name }) => Object.assign(obj, { [`${type}.${name}`]: permission_id }), {}),
                };

                const permissionsByRole = {
                    superadmin: {
                        data: [
                            'priority',
                            'declaredAt',
                            'builtAt',
                            'closedAt',
                            'address',
                            'addressDetails',
                            'populationTotal',
                            'populationCouples',
                            'populationMinors',
                            'accessToElectricity',
                            'accessToWater',
                            'trashEvacuation',
                            'owner',
                            'censusStatus',
                            'censusConductedBy',
                            'censusConductedAt',
                            'ownerComplaint',
                            'justiceProcedure',
                            'justiceRendered',
                            'justiceRenderedAt',
                            'justiceRenderedBy',
                            'justiceChallenged',
                            'policeStatus',
                            'policeRequestedAt',
                            'policeGrantedAt',
                            'bailiff',
                            'socialOrigins',
                            'comments',
                            'closingSolutions',
                            'city',
                            'epci',
                            'departement',
                            'fieldType',
                            'ownerType',
                            'actions',
                            'updatedAt',
                        ],
                    },
                    admin: {
                        data: [
                            'priority',
                            'declaredAt',
                            'builtAt',
                            'closedAt',
                            'address',
                            'addressDetails',
                            'populationTotal',
                            'populationCouples',
                            'populationMinors',
                            'accessToElectricity',
                            'accessToWater',
                            'trashEvacuation',
                            'owner',
                            'censusStatus',
                            'censusConductedBy',
                            'censusConductedAt',
                            'ownerComplaint',
                            'justiceProcedure',
                            'justiceRendered',
                            'justiceRenderedAt',
                            'justiceRenderedBy',
                            'justiceChallenged',
                            'policeStatus',
                            'policeRequestedAt',
                            'policeGrantedAt',
                            'bailiff',
                            'socialOrigins',
                            'comments',
                            'closingSolutions',
                            'city',
                            'epci',
                            'departement',
                            'fieldType',
                            'ownerType',
                            'actions',
                            'updatedAt',
                        ],
                    },
                };

                const subpromises = [];
                Object.keys(permissionsByRole).forEach((role) => {
                    Object.keys(permissionsByRole[role]).forEach((type) => {
                        const values = permissionsByRole[role][type].map(name => `(${hash.roles[role]}, ${hash.permissions[`${type}.${name}`]})`);
                        subpromises.push(
                            queryInterface.sequelize.query(
                                `INSERT INTO role_permissions(fk_role, fk_permission) VALUES ${values.join(',')}`,
                            ),
                        );
                    });
                });

                return Promise.all(subpromises);
            });
    },

    down: queryInterface => Promise.all(
        queryInterface.bulkDelete('role_permissions'),
        queryInterface.bulkDelete('permissions'),
    ),
};
