module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'contacts',
        {
            contact_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            fk_operator: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        },
    )
        .then(() => Promise.all([
            queryInterface.addConstraint('contacts', ['email'], {
                type: 'unique',
                name: 'uk_contacts_email',
            }),

            queryInterface.addConstraint('contacts', ['fk_operator'], {
                type: 'foreign key',
                name: 'fk_contacts_operator',
                references: {
                    table: 'operators',
                    field: 'operator_id',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),
        ])),

    down: queryInterface => queryInterface.dropTable('contacts'),
};
