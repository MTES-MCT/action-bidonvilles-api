module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'operators',
        {
            operator_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
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
        .then(() => queryInterface.addConstraint('operators', ['name'], {
            type: 'unique',
            name: 'uk_operators_name',
        })),

    down: queryInterface => queryInterface.dropTable('operators'),
};
