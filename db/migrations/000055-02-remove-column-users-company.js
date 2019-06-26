module.exports = {

    up: queryInterface => queryInterface.removeColumn(
        'users',
        'company',
    ),

    down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        t => queryInterface.addColumn(
            'users',
            'company',
            {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'inconnu',
            },
            {
                transaction: t,
            },
        )
            .then(() => queryInterface.changeColumn(
                'users',
                'company',
                {
                    type: Sequelize.STRING,
                    allowNull: false,
                    defaultValue: null,
                },
                {
                    transaction: t,
                },
            )),
    ),

};
