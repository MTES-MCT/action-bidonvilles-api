module.exports = {
    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.query(
            'INSERT INTO entities(name) VALUES(\'covid_comment\')',
            {
                transaction,
            },
        )
            .then(() => queryInterface.sequelize.query(
                'INSERT INTO features(name, fk_entity) VALUES(\'list\', \'covid_comment\')',
                {
                    transaction,
                },
            ))
            .then(async () => {
                const roles = ['direct_collaborator', 'collaborator', 'association', 'national_establisment'];
                const promises = roles.map(role => queryInterface.sequelize.query(
                    `INSERT INTO
                        permissions(fk_role_regular, fk_feature, fk_entity, allowed, fk_geographic_level)
                    VALUES
                        (:role, 'list', 'covid_comment', true, 'local')
                    RETURNING permission_id AS id`,
                    {
                        replacements: {
                            role,
                        },
                        transaction,
                    },
                ));

                const permissionIds = (await Promise.all(promises)).map(response => response[0][0].id);

                return permissionIds
                    .map(id => queryInterface.sequelize.query(
                        `INSERT INTO
                            covid_comment_permissions(fk_permission)
                        VALUES
                            (:id)`,
                        {
                            replacements: {
                                id,
                            },
                            transaction,
                        },
                    ));
            }),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkDelete(
            'permissions',
            {
                fk_entity: 'covid_comment',
            },
            {
                transaction,
            },
        )
            .then(() => queryInterface.bulkDelete(
                'features',
                {
                    fk_entity: 'covid_comment',
                },
                {
                    transaction,
                },
            ))
            .then(() => queryInterface.bulkDelete(
                'entities',
                {
                    name: 'covid_comment',
                },
                {
                    transaction,
                },
            )),
    ),

};
