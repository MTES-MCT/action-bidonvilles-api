module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        t => queryInterface.addColumn(
            'users',
            'fk_organization',
            {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            {
                transaction: t,
            },
        )
            .then(() => queryInterface.sequelize.query(
                'UPDATE users SET fk_organization = (SELECT organization_id FROM organizations WHERE fk_organization_type = \'prefecture_departement\' AND fk_departement = users.fk_departement)',
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.changeColumn(
                'users',
                'fk_organization',
                {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.addConstraint(
                'users',
                ['fk_organization'], {
                    type: 'foreign key',
                    name: 'fk_users_organization',
                    references: {
                        table: 'organizations',
                        field: 'organization_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'restrict',
                    transaction: t,
                },
            )),
    ),

    down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        t => queryInterface.sequelize.query(
            'UPDATE users SET fk_departement = (SELECT "departementCode" FROM organizations_full WHERE organization_id = users.fk_organization)',
            {
                transaction: t,
            },
        )
            .then(() => queryInterface.changeColumn(
                'users',
                'fk_departement',
                {
                    type: Sequelize.STRING(3),
                    allowNull: false,
                },
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.addConstraint('users', ['fk_departement'], {
                type: 'foreign key',
                name: 'fk_user_departement',
                references: {
                    table: 'departements',
                    field: 'code',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
                transaction: t,
            }))
            .then(() => queryInterface.removeConstraint(
                'users',
                'fk_users_organization',
                {
                    transaction: t,
                },
            ))
            .then(() => queryInterface.removeColumn(
                'users',
                'fk_organization',
                {
                    transaction: t,
                },
            )),
    ),

};
