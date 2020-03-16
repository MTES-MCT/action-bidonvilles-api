function create(queryInterface, Sequelize, transaction, isHistory) {
    const names = isHistory
        ? {
            tableName: 'plan_territories_history',
            planTable: 'plans_history',
            planId: 'hid',
        }
        : {
            tableName: 'plan_territories',
            planTable: 'plans2',
            planId: 'plan_id',
        };

    return queryInterface.createTable(
        names.tableName,
        {
            plan_territory_id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
            },
            fk_plan: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            fk_departement: {
                type: Sequelize.STRING(3),
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: true,
                defaultValue: null,
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        },
        {
            transaction,
        },
    )
        .then(() => queryInterface.addConstraint(
            names.tableName,
            ['fk_plan', 'fk_departement'],
            {
                type: 'unique',
                name: `uk_${names.tableName}`,
                transaction,
            },
        ))
        .then(() => queryInterface.addConstraint(
            names.tableName,
            ['fk_plan'],
            {
                type: 'foreign key',
                name: `fk_${names.tableName}_plan`,
                references: {
                    table: names.planTable,
                    field: names.planId,
                },
                onUpdate: 'cascade',
                onDelete: 'cascade',
                transaction,
            },
        ))
        .then(() => queryInterface.addConstraint(
            names.tableName,
            ['fk_departement'],
            {
                type: 'foreign key',
                name: `fk_${names.tableName}_departement`,
                references: {
                    table: 'departements',
                    field: 'code',
                },
                onUpdate: 'cascade',
                onDelete: 'cascade',
                transaction,
            },
        ))
        .then(() => queryInterface.sequelize.query(
            `CREATE FUNCTION ${names.tableName}_integrity_check() RETURNS trigger AS $${names.tableName}_integrity_check$
                DECLARE
                    region VARCHAR;
                    newregion VARCHAR;
                BEGIN
                    SELECT INTO region departements.fk_region
                    FROM ${names.tableName}
                    LEFT JOIN departements ON ${names.tableName}.fk_departement = departements.code
                    WHERE ${names.tableName}.fk_plan = NEW.fk_plan
                    LIMIT 1;

                    IF region IS NOT NULL THEN
                        SELECT INTO newregion departements.fk_region
                        FROM departements
                        WHERE departements.code = NEW.fk_departement;

                        IF newregion <> region THEN
                            RAISE EXCEPTION 'all departements of a plan must be in the same region';
                        END IF;
                    END IF;

                    RETURN NEW;
                END;
            $${names.tableName}_integrity_check$ LANGUAGE plpgsql;`,
            {
                transaction,
            },
        ))
        .then(() => queryInterface.sequelize.query(
            `CREATE TRIGGER ${names.tableName}_integrity_check BEFORE INSERT OR UPDATE ON ${names.tableName}
                FOR EACH ROW EXECUTE PROCEDURE ${names.tableName}_integrity_check();`,
            {
                transaction,
            },
        ));
}

function remove(queryInterface, transaction, isHistory) {
    const names = isHistory
        ? {
            tableName: 'plan_territories_history',
        }
        : {
            tableName: 'plan_territories',
        };

    return queryInterface.sequelize.query(
        `DROP TRIGGER ${names.tableName}_integrity_check ON ${names.tableName}`,
        {
            transaction,
        },
    )
        .then(() => queryInterface.sequelize.query(
            `DROP FUNCTION ${names.tableName}_integrity_check()`,
            {
                transaction,
            },
        ))
        .then(() => queryInterface.removeConstraint(
            names.tableName,
            `fk_${names.tableName}_plan`,
            {
                transaction,
            },
        ))
        .then(() => queryInterface.removeConstraint(
            names.tableName,
            `fk_${names.tableName}_departement`,
            {
                transaction,
            },
        ))
        .then(() => queryInterface.removeConstraint(
            names.tableName,
            `uk_${names.tableName}`,
            {
                transaction,
            },
        ))
        .then(() => queryInterface.dropTable(
            names.tableName,
            {
                transaction,
            },
        ));
}

module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => create(queryInterface, Sequelize, transaction, false)
            .then(() => create(queryInterface, Sequelize, transaction, true)),
    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        transaction => remove(queryInterface, transaction, false)
            .then(() => remove(queryInterface, transaction, true)),
    ),

};
