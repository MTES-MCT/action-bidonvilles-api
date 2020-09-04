module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.addColumn(
            'owner_types',
            'position',
            {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            {
                transaction,
            },
        )
            // SET position 0 to public
            .then(() => queryInterface.sequelize.query(
                'UPDATE owner_types SET position = 0 WHERE owner_type_id = 2',
                {
                    transaction,
                },
            ))
            // SET position 1 to privé
            .then(() => queryInterface.sequelize.query(
                'UPDATE owner_types SET position = 1 WHERE owner_type_id = 3',
                {
                    transaction,
                },
            ))
            // SET position 2 to inconnu
            .then(() => queryInterface.sequelize.query(
                'UPDATE owner_types SET position = 2 WHERE owner_type_id = 1',
                {
                    transaction,
                },
            ))

    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeColumn(
            'owner_types',
            'position',
            { transaction },
        ),
    ),

};
