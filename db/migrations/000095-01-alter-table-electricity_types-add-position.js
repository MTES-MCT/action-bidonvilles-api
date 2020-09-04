module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.addColumn(
            'electricity_types',
            'position',
            {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            {
                transaction,
            },
        )
            // SET position 0 to oui
            .then(() => queryInterface.sequelize.query(
                'UPDATE electricity_types SET position = 0 WHERE electricity_type_id = 3',
                {
                    transaction,
                },
            ))
            // SET position 1 to oui (acces régulier)
            .then(() => queryInterface.sequelize.query(
                'UPDATE electricity_types SET position = 1 WHERE electricity_type_id = 4',
                {
                    transaction,
                },
            ))
            // SET position 2 to oui (acces irrégulier)
            .then(() => queryInterface.sequelize.query(
                'UPDATE electricity_types SET position = 2 WHERE electricity_type_id = 5',
                {
                    transaction,
                },
            ))
            // SET position 3 to non
            .then(() => queryInterface.sequelize.query(
                'UPDATE electricity_types SET position = 3 WHERE electricity_type_id = 2',
                {
                    transaction,
                },
            ))
            // SET position 4 to inconnu
            .then(() => queryInterface.sequelize.query(
                'UPDATE electricity_types SET position = 4 WHERE electricity_type_id = 1',
                {
                    transaction,
                },
            )),

    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeColumn(
            'electricity_types',
            'position',
            { transaction },
        ),
    ),

};
