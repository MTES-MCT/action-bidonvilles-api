module.exports = {

    up: queryInterface => queryInterface.addConstraint(
        'users',
        ['fk_city'], {
            type: 'foreign key',
            name: 'fk_users_city',
            references: {
                table: 'cities',
                field: 'code',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        },
    ),

    down: queryInterface => queryInterface.removeConstraint(
        'users',
        'fk_users_city',
    ),

};
