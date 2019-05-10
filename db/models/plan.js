const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Plan extends Model {}

    Plan.init(
        {
            plan_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            started_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            ended_at: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            fk_ngo: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            fk_type: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                onUpdate: DataTypes.NOW,
            },
            updated_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Plan',
            tableName: 'plans',
        },
    );

    return Plan;
};
