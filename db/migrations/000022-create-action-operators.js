module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'action_operators',
        {
            action_operator_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            fk_action: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            fk_operator: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        },
    )
        .then(() => Promise.all([
            queryInterface.addConstraint('action_operators', ['fk_action', 'fk_operator'], {
                type: 'unique',
                name: 'uk_operator',
            }),

            queryInterface.addConstraint('action_operators', ['fk_action'], {
                type: 'foreign key',
                name: 'fk_action_operators_action',
                references: {
                    table: 'actions',
                    field: 'action_id',
                },
                onUpdate: 'cascade',
                onDelete: 'cascade',
            }),

            queryInterface.addConstraint('action_operators', ['fk_operator'], {
                type: 'foreign key',
                name: 'fk_action_operators_operator',
                references: {
                    table: 'operators',
                    field: 'operator_id',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),
        ])),

    down: queryInterface => queryInterface.dropTable('action_operators'),
};
