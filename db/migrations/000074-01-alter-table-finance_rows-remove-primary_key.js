module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeConstraint(
            'finance_rows',
            'finance_rows_pkey',
            {
                transaction,
            },
        ),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.addConstraint(
            'finance_rows',
            ['fk_finance_type', 'fk_finance'],
            {
                type: 'primary key',
            },
            {
                transaction,
            },
        ),
    ),

};
