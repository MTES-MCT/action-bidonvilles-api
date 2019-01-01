module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(
            'social_origins',
            {
                social_origin_id: {
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
            return queryInterface.addConstraint('social_origins', [ 'label' ], {
                type: 'unique',
                name: 'uk_social_origins_label',
            });
        });
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('social_origins');
    },
};