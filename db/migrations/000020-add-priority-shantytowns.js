function addColumnTo(queryInterface, Sequelize, table) {
    return queryInterface.addColumn(
        table,
        'priority',
        {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 4,
        },
    );
}

function addConstraintTo(queryInterface, table) {
    queryInterface.addConstraint(table, ['priority'], {
        type: 'check',
        name: 'check_priority_value',
        where: {
            $and: [
                {
                    priority: { $gte: 1 },
                },
                {
                    priority: { $lte: 4 },
                },
            ],
        },
    });
}

module.exports = {
    up: (queryInterface, Sequelize) => Promise.all([
        addColumnTo(queryInterface, Sequelize, 'shantytowns'),
        addColumnTo(queryInterface, Sequelize, 'ShantytownHistories'),
    ]).then(() => Promise.all([
        addConstraintTo(queryInterface, 'shantytowns'),
        addConstraintTo(queryInterface, 'ShantytownHistories'),
    ])),

    down: queryInterface => Promise.all([
        queryInterface.removeColumn('shantytowns', 'priority'),
        queryInterface.removeColumn('ShantytownHistories', 'priority'),
    ]),
};
