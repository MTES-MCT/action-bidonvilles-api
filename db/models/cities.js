module.exports = function (sequelize, DataTypes) {
    const City = sequelize.define('City', {
        code: {
            type: DataTypes.STRING(5),
            allowNull: false,
            primaryKey: true,
            field: 'city_code',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate : DataTypes.NOW,
            field: 'updated_at',
        },
    }, {
        tableName: 'cities',
        underscored: true,
        paranoid: false,
        timestamps: true,
    });

    return City;
};
