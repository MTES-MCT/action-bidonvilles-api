module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        t => queryInterface.createTable(
            'organization_categories',
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
            'organization_categories',
            ['name'],
            {
                type: 'unique',
                name: 'uk_organization_categories_name',
                transaction: t,
            },
        )),
    ),

    down: queryInterface => queryInterface.dropTable('organization_categories'),

};
