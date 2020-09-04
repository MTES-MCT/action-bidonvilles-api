module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.addColumn(
            'field_types',
            'position',
            {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            {
                transaction,
            },
        )
            // SET position 0 to terrain
            .then(() => queryInterface.sequelize.query(
                'UPDATE field_types SET position = 0 WHERE field_type_id = 2',
                {
                    transaction,
                },
            ))
            // SET position 1 to immeuble
            .then(() => queryInterface.sequelize.query(
                'UPDATE field_types SET position = 1 WHERE field_type_id = 3',
                {
                    transaction,
                },
            ))
            // SET position 2 to inconnu
            .then(() => queryInterface.sequelize.query(
                'UPDATE field_types SET position = 2 WHERE field_type_id = 1',
                {
                    transaction,
                },
            ))

    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeColumn(
            'field_types',
            'position',
            { transaction },
        ),
    ),

};
