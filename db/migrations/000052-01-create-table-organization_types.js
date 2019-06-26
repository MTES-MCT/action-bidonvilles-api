module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        t => queryInterface.createTable(
            'organization_types',
            {
                uid: {
                    type: Sequelize.STRING,
                    allowNull: false,
                    primaryKey: true,
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                full_name: {
                    type: Sequelize.STRING,
                    allowNull: true,
                },
                fk_organization_category: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                    onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
            {
                transaction: t,
            },
        ).then(() => queryInterface.addConstraint(
            'organization_types',
            ['name'],
            {
                type: 'unique',
                name: 'uk_organization_types_name',
                transaction: t,
            },
        )).then(() => queryInterface.addConstraint(
            'organization_types',
            ['fk_organization_category'],
            {
                type: 'foreign key',
                name: 'fk_organization_types_organization_category',
                references: {
                    table: 'organization_categories',
                    field: 'uid',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
                transaction: t,
            },
        )),
    ),

    down: queryInterface => queryInterface.dropTable('organization_types'),

};
