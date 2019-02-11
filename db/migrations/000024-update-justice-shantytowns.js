function addColumn(queryInterface, name, options) {
    return Promise.all([
        queryInterface.addColumn('shantytowns', name, options),
        queryInterface.addColumn('ShantytownHistories', name, options),
    ]);
}

function removeColumn(queryInterface, name) {
    return Promise.all([
        queryInterface.removeColumn('shantytowns', name),
        queryInterface.removeColumn('ShantytownHistories', name),
    ]);
}

module.exports = {
    up: (queryInterface, Sequelize) => Promise.all([
        // @todo : we should probably have constraints over those fields
        addColumn(
            queryInterface,
            'justice_procedure',
            {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
        ),
        addColumn(
            queryInterface,
            'justice_rendered',
            {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
        ),
        addColumn(
            queryInterface,
            'justice_challenged',
            {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
        ),
        queryInterface.removeColumn('shantytowns', 'justice_status'),
    ]),

    down: (queryInterface, Sequelize) => Promise.all([
        removeColumn(queryInterface, 'justice_procedure'),
        removeColumn(queryInterface, 'justice_rendered'),
        removeColumn(queryInterface, 'justice_challenged'),
        queryInterface.addColumn(
            // @todo : in real-life, we should backup the value from ShantytownHistories...
            // @todo : also, i'm not fan of duplicating the definition of justice_status here
            'shantytowns',
            'justice_status',
            {
                type: Sequelize.ENUM('none', 'seized', 'rendered'),
                allowNull: true,
            },
        ),
    ]),
};
