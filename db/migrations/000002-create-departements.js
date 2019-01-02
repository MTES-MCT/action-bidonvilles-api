module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'departements',
        {
            code: {
                type: Sequelize.STRING(3),
                allowNull: false,
                primaryKey: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            latitude: {
                type: Sequelize.DOUBLE(2, 15),
                allowNull: false,
            },
            longitude: {
                type: Sequelize.DOUBLE(2, 15),
                allowNull: false,
            },
            fk_region: {
                type: Sequelize.STRING(2),
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
        .then(() => Promise.all([
            queryInterface.addConstraint('departements', ['name'], {
                type: 'unique',
                name: 'uk_departements_name',
            }),
            queryInterface.addConstraint('departements', ['fk_region'], {
                type: 'foreign key',
                name: 'fk_departements_region',
                references: {
                    table: 'regions',
                    field: 'code',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),
        ])),

    down: queryInterface => queryInterface.dropTable('departements'),
};
