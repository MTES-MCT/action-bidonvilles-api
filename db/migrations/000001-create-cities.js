module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable(
            'cities',
            {
                city_code: {
                    type: Sequelize.STRING(5),
                    allowNull: false,
                    primaryKey: true,
                },
                name: {
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
        );
    },

    down: (queryInterface) => {
        return queryInterface.dropTable('cities');
    },
};