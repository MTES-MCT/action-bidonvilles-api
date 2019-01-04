function createTable(queryInterface, Sequelize, name, additionalColumns = {}) {
    return queryInterface.createTable(
        name,
        Object.assign({
            status: {
                type: Sequelize.ENUM('open', 'gone', 'covered', 'expelled'),
                allowNull: false,
                defaultValue: 'open',
            },
            closed_at: {
                type: Sequelize.DATE,
                allowNull: true,
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
        }, additionalColumns),
    ).then(() => Promise.all([
        queryInterface.addConstraint(name, ['fk_city'], {
            type: 'foreign key',
            name: 'fk_shantytowns_city',
            references: {
                table: 'cities',
                field: 'code',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint(name, ['fk_field_type'], {
            type: 'foreign key',
            name: 'fk_shantytowns_field_type',
            references: {
                table: 'field_types',
                field: 'field_type_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint(name, ['fk_owner_type'], {
            type: 'foreign key',
            name: 'fk_shantytowns_owner_type',
            references: {
                table: 'owner_types',
                field: 'owner_type_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint(name, ['created_by'], {
            type: 'foreign key',
            name: 'fk_shantytowns_creator',
            references: {
                table: 'users',
                field: 'user_id',
            },
            onUpdate: 'cascade',
            onDelete: 'restrict',
        }),

        queryInterface.addConstraint(name, ['closed_at'], {
            type: 'check',
            name: 'check_closed_after_built',
            where: {
                $or: [
                    {
                        built_at: { $eq: null },
                    },
                    {
                        closed_at: { $eq: null },
                    },
                    {
                        $and: {
                            built_at: { $ne: null },
                            closed_at: {
                                $ne: null,
                                $gt: Sequelize.col('built_at'),
                            },
                        },
                    },
                ],
            },
        }),

        queryInterface.addConstraint(name, ['closed_at'], {
            type: 'check',
            name: 'check_closed_at_notNull',
            where: {
                $or: [
                    {
                        $and: {
                            status: { $eq: 'open' },
                            closed_at: { $eq: null },
                        },
                    },
                    {
                        $and: {
                            status: { $ne: 'open' },
                            closed_at: { $ne: null },
                        },
                    },
                ],
            },
        }),
    ]));
}

module.exports = {
    up: (queryInterface, Sequelize) => Promise.all([
        createTable(queryInterface, Sequelize, 'shantytowns', {
            shantytown_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
        }),
        createTable(queryInterface, Sequelize, 'ShantytownHistories', {
            shantytown_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            hid: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            archivedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        }),
    ]),

    down: queryInterface => Promise.all([
        queryInterface.dropTable('shantytowns'),
        queryInterface.dropTable('ShantytownHistories'),
    ]),
};
