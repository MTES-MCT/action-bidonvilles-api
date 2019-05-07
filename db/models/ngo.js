const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Ngo extends Model {
        static findAll(options) {
            return super.findAll(options);
        }
    }

    Ngo.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
            },
            name: DataTypes.STRING,
            createdAt: DataTypes.DATE,
            createdBy: DataTypes.INTEGER,
            updatedAt: DataTypes.DATE,
            updatedBy: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'Ngo',
            tableName: 'ngos',
        },
    );

    return Ngo;
};
