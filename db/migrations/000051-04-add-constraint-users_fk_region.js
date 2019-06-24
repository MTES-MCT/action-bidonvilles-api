module.exports = {

    up: queryInterface => queryInterface.addConstraint(
        'users',
        ['fk_region'], {
            type: 'foreign key',
            name: 'fk_users_region',
            references: {
                table: 'regions',
                field: 'code',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        },
    ),

    down: queryInterface => queryInterface.removeConstraint(
        'users',
        'fk_users_region',
    ),

};
