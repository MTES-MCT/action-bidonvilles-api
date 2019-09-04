module.exports = {

    up: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.bulkInsert(
            'entities',
            [
                'shantytown',
                'shantytown_comment',
                'plan',
                'user',
            ].map(name => ({ name })),
            {
                transaction,
            },
        ),
    ),

    down: queryInterface => queryInterface.bulkDelete('entities'),

};
