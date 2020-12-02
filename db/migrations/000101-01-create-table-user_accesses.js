module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.createTable(
            'user_accesses',
            {
                user_access_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                fk_user: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                sent_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                used_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                expires_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
            {
                transaction,
            },
        )
            .then(() => queryInterface.addConstraint(
                'user_accesses',
                ['fk_user'],
                {
                    type: 'foreign key',
                    name: 'fk_user_accesses_user',
                    references: {
                        table: 'users',
                        field: 'user_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'cascade',
                    transaction,
                },
            ))
            .then(() => queryInterface.addConstraint(
                'user_accesses',
                ['sent_by'],
                {
                    type: 'foreign key',
                    name: 'fk_user_accesses_admin',
                    references: {
                        table: 'users',
                        field: 'user_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'cascade',
                    transaction,
                },
            )),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeConstraint(
            'user_accesses',
            'fk_user_accesses_admin',
            {
                transaction,
            },
        )
            .then(() => queryInterface.removeConstraint(
                'user_accesses',
                'fk_user_accesses_user',
                {
                    transaction,
                },
            ))
            .then(() => queryInterface.dropTable('user_accesses', { transaction })),
    ),

};
