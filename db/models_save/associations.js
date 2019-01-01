module.exports = function (models) {
    const {
        shantytowns,
        cities,
        field_types,
        owner_types,
        social_origins,
        town_types,
        shantytown_origins,
    } = models;

    shantytowns.belongsTo(cities, {
        foreignKey: {
            fieldName: 'fk_city',
            allowNull: false,
            require: true,
        },
        targetKey: 'city_id',
    });
    shantytowns.belongsTo(field_types, {
        foreignKey: {
            fieldName: 'fk_field_type',
        },
        targetKey: 'field_type_id',
    });
    shantytowns.belongsTo(owner_types, {
        foreignKey: {
            fieldName: 'fk_owner_type',
        },
        targetKey: 'owner_type_id',
    });
    shantytowns.belongsTo(town_types, {
        foreignKey: {
            fieldName: 'fk_town_type',
            allowNull: false,
            require: true,
        },
        targetKey: 'town_type_id',
    });

    // 
    shantytowns.belongsToMany(social_origins, {
        as: 'social_origins',
        through: {
            model: shantytown_origins,
            unique: false,
        },
        foreignKey: 'fk_shantytown_id',
    });

    social_origins.belongsToMany(shantytowns, {
        through: {
            model: shantytown_origins,
            unique: false,
        },
        foreignKey: 'fk_social_origin_id',
    });
};