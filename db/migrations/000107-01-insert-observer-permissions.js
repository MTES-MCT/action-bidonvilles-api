const permissions = {
    roles_regular: {
        observer: {
            shantytown: {
                list: { level: 'local', data: { data_justice: false } },
                read: { level: 'local', data: { data_justice: false } }
            },
            plan: {
                list: { level: 'local', data: { data_finances: false } },
                read: { level: 'local', data: { data_finances: false } },
            },
            shantytown_comment: {
                list: { level: 'local', data: {} },
                create: { level: 'local', data: {} },
            },
            covid_comment: {
                list: { level: 'local', data: {} },
            },
        },
    },
};

module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.query(
            'INSERT INTO roles_regular(role_id, name) VALUES(\'observer\', \'Observateur\')',
            {
                transaction,
            },
        )
        .then(() => queryInterface.sequelize.query(
            'INSERT INTO organization_categories(uid, name_singular, name_plural) VALUES(\'observer\', \'Observateur\', \'Observateurs\')',
            {
                transaction,
            },
        ))
        .then(() => queryInterface.sequelize.query(
            'INSERT INTO organization_types(name_singular, name_plural, fk_category, fk_role) VALUES(\'Observateur\', \'Observateurs\', \'observer\', \'observer\')',
            {
                transaction,
            },
        ))
        .then(async () => {
            const p = Object.keys(permissions).reduce((promises, roleType) => {
                Object.keys(permissions[roleType]).forEach((roleId) => {
                    Object.keys(permissions[roleType][roleId]).forEach((entity) => {
                        Object.keys(permissions[roleType][roleId][entity]).forEach((feature) => {
                            promises.push(
                                queryInterface.sequelize.query(
                                    `INSERT INTO
                                        permissions(fk_organization, fk_role_admin, fk_role_regular, fk_feature, fk_entity, allowed, fk_geographic_level)
                                    VALUES
                                        (NULL, :adminId, :regularId, :feature, :entity, TRUE, :level)
                                    RETURNING permission_id`,
                                    {
                                        transaction,
                                        replacements: {
                                            adminId: roleType === 'roles_admin' ? roleId : null,
                                            regularId: roleType === 'roles_regular' ? roleId : null,
                                            feature,
                                            entity,
                                            level: permissions[roleType][roleId][entity][feature].level,
                                        },
                                    },
                                )
                                    .then(([[{ permission_id: permissionId }]]) => queryInterface.bulkInsert(
                                        `${entity}_permissions`,
                                        [
                                            Object.assign({ fk_permission: permissionId }, permissions[roleType][roleId][entity][feature].data || {}),
                                        ],
                                        {
                                            transaction,
                                        },
                                    )),
                            );
                        });
                    });
                });

                return promises;
            }, []);

            return Promise.all(p);
        },
    )),
    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkDelete(
            'permissions',
            {
                fk_role_regular: 'observer',
            },
            {
                transaction,
            },
        )
        .then(() => queryInterface.bulkDelete(
            'organization_types',
            {
                fk_role: 'observer',
                fk_category: 'observer'
            },
            {
                transaction,
            },
        ))
        .then(() => queryInterface.bulkDelete(
            'organization_categories',
            {
                uid: 'observer',
            },
            {
                transaction,
            },
        ))
        .then(() => queryInterface.bulkDelete(
            'roles_regular',
            {
                role_id: 'observer',
            },
            {
                transaction,
            },
        )),
    )
};
