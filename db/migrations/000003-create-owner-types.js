module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(
            'owner_types',
            {
                owner_type_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                label: {
                    type: Sequelize.STRING,
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
            return queryInterface.addConstraint('owner_types', [ 'label' ], {
                type: 'unique',
                name: 'uk_owner_types_label',
            });
        });
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('owner_types');
    },
};