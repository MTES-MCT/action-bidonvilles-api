

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.queryInterface.addColumn(
            'electricity_types',
            'uid',
            {
                type: Sequelize.STRING,
                allowNull: true,
            },
        ).then(() => queryInterface.sequelize.query(
            'UPDATE electricity_types SET uid = :value where electricity_type_id = 1',
            {
                transaction,
                replacements: { value: 'inconnu' },
            },
        )).then(() => queryInterface.sequelize.query(
            'UPDATE electricity_types SET uid = :value where electricity_type_id = 2',
            {
                transaction,
                replacements: { value: 'non' },
            },
        )).then(() => queryInterface.sequelize.query(
            'UPDATE electricity_types SET uid = :value where electricity_type_id = 3',
            {
                transaction,
                replacements: { value: 'oui' },
            },
        )),
    )
        // Make UID mandatory
        .then(() => queryInterface.changeColumn('electricity_types', 'uid', {
            type: Sequelize.STRING,
            allowNull: false,
        })),


    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeColumn('electricity_types', 'uid', { transaction }),
    ),


};
