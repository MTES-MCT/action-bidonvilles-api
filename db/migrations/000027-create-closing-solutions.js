module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'closing_solutions',
        {
            closing_solution_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            label: {
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
    ).then(() => queryInterface.addConstraint('closing_solutions', ['label'], {
        type: 'unique',
        name: 'uk_closing_solutions_label',
    })),

    down: queryInterface => queryInterface.dropTable('closing_solutions'),
};
