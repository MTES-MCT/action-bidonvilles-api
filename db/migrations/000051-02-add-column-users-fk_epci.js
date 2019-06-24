module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.addColumn(
        'users',
        'fk_epci',
        {
            type: Sequelize.STRING(9),
            allowNull: true,
        },
    ),

    down: queryInterface => queryInterface.removeColumn(
        'users',
        'fk_epci',
    ),

};
