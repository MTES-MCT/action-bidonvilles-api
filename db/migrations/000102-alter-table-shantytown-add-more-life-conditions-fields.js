const getFields = (Sequelize) => ({
    // WATER FIELDS
    water_potable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_continuous_access: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_public_point: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_distance: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    water_roads_to_cross: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_everyone_has_access: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_stagnant_water: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_hand_wash_access: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    water_hand_wash_access_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    // SANITARY FIELDS
    sanitary_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    sanitary_insalubrious: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    sanitary_on_site: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    // TRASH EVACUATION
    trash_cans_on_site: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    trash_accumulation: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    trash_evacuation_regular: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    // VERMIN
    vermin: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    vermin_comments: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    // FIRE PREVENTION
    fire_prevention_measures: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    fire_prevention_diagnostic: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    fire_prevention_site_accessible: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
    fire_prevention_comments: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
})

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => Promise.all(Object.entries(getFields(Sequelize)).flatMap(([field, props]) => [
            queryInterface.addColumn(
                'shantytowns',
                field,
                props,
                {
                    transaction,
                },
            ),
            queryInterface.addColumn(
                'ShantytownHistories',
                field,
                props,
                {
                    transaction,
                },
            )
        ]))    
    ),
    down: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => Promise.all(Object.keys(getFields(Sequelize)).flatMap(field => [
            queryInterface.removeColumn(
                'shantytowns',
                field,
                {
                    transaction,
                },
            ),
            queryInterface.removeColumn(
                'ShantytownHistories',
                field,
                {
                    transaction,
                },
            )
        ]))
    ),
};

