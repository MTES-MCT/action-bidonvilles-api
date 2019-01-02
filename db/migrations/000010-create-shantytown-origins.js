module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
            'shantytown_origins',
            {
                fk_shantytown: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                fk_social_origin: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
	                onUpdate : Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
        ).then(() => {
            return Promise.all([
                queryInterface.addConstraint('shantytown_origins', [ 'fk_shantytown', 'fk_social_origin' ], {
                    type: 'primary key',
                    name: 'pk_shantytown_origins',
                }),

                queryInterface.addConstraint('shantytown_origins', [ 'fk_shantytown' ], {
                    type: 'foreign key',
                    name: 'fk_shantytown_origins_shantytown',
                    references: {
                        table: 'shantytowns',
                        field: 'shantytown_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'cascade',
                }),

                queryInterface.addConstraint('shantytown_origins', [ 'fk_social_origin' ], {
                    type: 'foreign key',
                    name: 'fk_shantytown_origins_social_origin',
                    references: {
                        table: 'social_origins',
                        field: 'social_origin_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'cascade',
                }),
            ]);
        }),

    down: (queryInterface) => queryInterface.dropTable('shantytown_origins'),
};
