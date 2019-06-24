module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.addColumn(
        'users',
        'fk_city',
        {
            type: Sequelize.STRING(5),
            allowNull: true,
        },
    ),

    down: queryInterface => queryInterface.removeColumn(
        'users',
        'fk_city',
    ),

};
