module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'shantytowns',
        {
            shantytown_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            latitude: {
                type: Sequelize.DOUBLE(2, 15),
                allowNull: false,
            },
            longitude: {
                type: Sequelize.DOUBLE(2, 15),
                allowNull: false,
            },
            address: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            address_details: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            fk_city: {
                type: Sequelize.STRING(5),
                allowNull: false,
            },
            built_at: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            fk_field_type: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            fk_owner_type: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            population_total: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            population_couples: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            population_minors: {
                type: Sequelize.INTEGER.UNSIGNED,
                allowNull: true,
            },
            access_to_electricity: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            access_to_water: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            trash_evacuation: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            justice_status: {
                type: Sequelize.BOOLEAN,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
    ).then(() => Promise.all([
        queryInterface.addConstraint('shantytowns', ['fk_city'], {
            type: 'foreign key',
            name: 'fk_shantytowns_city',
            references: {
                table: 'cities',
                field: 'code',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint('shantytowns', ['fk_field_type'], {
            type: 'foreign key',
            name: 'fk_shantytowns_field_type',
            references: {
                table: 'field_types',
                field: 'field_type_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint('shantytowns', ['fk_owner_type'], {
            type: 'foreign key',
            name: 'fk_shantytowns_owner_type',
            references: {
                table: 'owner_types',
                field: 'owner_type_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint('shantytowns', ['created_by'], {
            type: 'foreign key',
            name: 'fk_shantytowns_creator',
            references: {
                table: 'users',
                field: 'user_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),
    ])),

    down: queryInterface => queryInterface.dropTable('shantytowns'),
};
