module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.createTable(
            'shantytown_covid_comments',
            {
                shantytown_covid_comment_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                fk_comment: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                date: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                information: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                distribution_de_kits: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                cas_contacts: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                cas_suspects: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                cas_averes: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                created_by: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                updated_by: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: null,
                    onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            },
            {
                transaction,
            },
        ).then(() => queryInterface.addConstraint(
            'shantytown_covid_comments',
            ['fk_comment'],
            {
                type: 'foreign key',
                name: 'fk_shantytown_covid_comments_comment',
                references: {
                    table: 'shantytown_comments',
                    field: 'shantytown_comment_id',
                },
                onUpdate: 'cascade',
                onDelete: 'cascade',
                transaction,
            },
        ))
            .then(() => queryInterface.addConstraint(
                'shantytown_covid_comments',
                ['created_by'],
                {
                    type: 'foreign key',
                    name: 'fk_shantytown_covid_comments_creator',
                    references: {
                        table: 'users',
                        field: 'user_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'restrict',
                    transaction,
                },
            ))
            .then(() => queryInterface.addConstraint(
                'shantytown_covid_comments',
                ['updated_by'],
                {
                    type: 'foreign key',
                    name: 'fk_shantytown_covid_comments_editor',
                    references: {
                        table: 'users',
                        field: 'user_id',
                    },
                    onUpdate: 'cascade',
                    onDelete: 'restrict',
                    transaction,
                },
            )),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => queryInterface.removeConstraint(
            'shantytown_covid_comments',
            'fk_shantytown_covid_comments_creator',
            {
                transaction,
            },
        )
            .then(() => queryInterface.removeConstraint(
                'shantytown_covid_comments',
                'fk_shantytown_covid_comments_editor',
                {
                    transaction,
                },
            ))
            .then(() => queryInterface.removeConstraint(
                'shantytown_covid_comments',
                'fk_shantytown_covid_comments_comment',
                {
                    transaction,
                },
            ))
            .then(() => queryInterface.dropTable('shantytown_covid_comments', { transaction })),
    ),

};
