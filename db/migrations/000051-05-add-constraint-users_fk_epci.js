module.exports = {

    up: queryInterface => queryInterface.addConstraint(
        'users',
        ['fk_epci'], {
            type: 'foreign key',
            name: 'fk_users_epci',
            references: {
                table: 'epci',
                field: 'code',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        },
    ),

    down: queryInterface => queryInterface.removeConstraint(
        'users',
        'fk_users_epci',
    ),

};
