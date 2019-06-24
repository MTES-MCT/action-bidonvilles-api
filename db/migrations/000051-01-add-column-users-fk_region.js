module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.addColumn(
        'users',
        'fk_region',
        {
            type: Sequelize.STRING(2),
            allowNull: true,
        },
    ),

    down: queryInterface => queryInterface.removeColumn(
        'users',
        'fk_region',
    ),

};
