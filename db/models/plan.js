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
            households_affected: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_affected: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            children_schoolable: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            households_who_got_housing_with_help: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            households_who_got_housing_without_help: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            households_who_were_hosted: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            children_schooled: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_accessing_health: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_helped_for_employment: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_who_got_employment: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            households_domiciled: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_included: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_successfully_helped: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_excluded: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_who_resigned: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_pole_emploi: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_mission_locale: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_with_bank_account: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_trainee: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            average_duration: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            comment: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            households: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            european_people: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            french_people: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            non_european_people: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            young_kids: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            other_kids: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            schooled_kids: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_asking_for_cmu: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            people_with_cmu: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            minors_with_admin_procedure: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            minors_with_justice_procedure: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
