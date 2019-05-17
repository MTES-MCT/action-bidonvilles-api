module.exports = {
    up: (queryInterface, Sequelize) => Promise.all([
        queryInterface.addColumn(
            'users',
            'active',
            {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        ),
        queryInterface.changeColumn(
            'users',
            'password',
            {
                type: Sequelize.TEXT,
                allowNull: true,
                defaultValue: null,
            },
        ),
    ]).then(() => queryInterface.changeColumn(
        'users',
        'active',
        {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    )).then(() => queryInterface.addConstraint('users', ['active', 'password'], {
        type: 'check',
        name: 'check_active_user_has_password',
        where: {
            $or: [
                {
                    $and: {
                        active: { $eq: false },
                        password: { $eq: null },
                    },
                },
                {
                    $and: {
                        active: { $eq: true },
                        password: { $ne: null },
                    },
                },
            ],
        },
    })),

    down: (queryInterface, Sequelize) => queryInterface.removeConstraint('users', 'check_active_user_has_password')
        .then(() => Promise.all([
            queryInterface.removeColumn('users', 'active'),
            queryInterface.changeColumn(
                'users',
                'password',
                {
                    type: Sequelize.TEXT,
                    allowNull: false,
                    defaultValue: '',
                },
            ),
        ])),

};