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
                field: 'ngo_id',
            },
            name: DataTypes.STRING,
            created_at: DataTypes.DATE,
            created_by: DataTypes.INTEGER,
            updated_at: DataTypes.DATE,
            updated_by: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'Ngo',
            tableName: 'ngos',
        },
    );

    return Ngo;
};
