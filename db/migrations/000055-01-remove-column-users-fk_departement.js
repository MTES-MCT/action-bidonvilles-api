module.exports = {

    up: queryInterface => queryInterface.removeColumn(
        'users',
        'fk_departement',
    ),

    down: (queryInterface, Sequelize) => queryInterface.addColumn(
        'users',
        'fk_departement',
        {
            type: Sequelize.STRING(3),
            allowNull: true,
        },
    ),

};
