module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'regions',
        {
            code: {
                type: Sequelize.STRING(2),
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
    )
        .then(() => queryInterface.addConstraint('regions', ['name'], {
            type: 'unique',
            name: 'uk_regions_name',
        })),

    down: queryInterface => queryInterface.dropTable('regions'),
};
