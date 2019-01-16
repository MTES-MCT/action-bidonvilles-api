const { sequelize } = require('../models');

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.createTable(
        'action_contacts',
        {
            action_contact_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            fk_action: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            fk_contact: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        },
    )
        .then(() => Promise.all([
            queryInterface.addConstraint('action_contacts', ['fk_action', 'fk_contact'], {
                type: 'unique',
                name: 'uk_contact',
            }),

            queryInterface.addConstraint('action_contacts', ['fk_action'], {
                type: 'foreign key',
                name: 'fk_action_contacts_action',
                references: {
                    table: 'actions',
                    field: 'action_id',
                },
                onUpdate: 'cascade',
                onDelete: 'cascade',
            }),

            queryInterface.addConstraint('action_contacts', ['fk_contact'], {
                type: 'foreign key',
                name: 'fk_action_contacts_contact',
                references: {
                    table: 'contacts',
                    field: 'contact_id',
                },
                onUpdate: 'cascade',
                onDelete: 'restrict',
            }),

            queryInterface.createFunction(
                'checkActionToContactRelation',
                [],
                'trigger',
                'plpgsql',
                `DECLARE
                    operator integer;
                    total integer;
                BEGIN
                    operator := 'SELECT fk_operator FROM contacts WHERE contact_id = ' || NEW.fk_contact;
                    total := 'SELECT COUNT(*) FROM action_operators WHERE fk_action = ' || NEW.fk_action || ' AND fk_operator = ' || operator;

                    IF total <> 1 THEN
                        RAISE EXCEPTION 'A contact can only be related to an action if he is a member of an operator that is associated to that same action itself';
                    END IF;

                    RETURN NEW;
                END;`,
            ),
        ]))
        .then(() => sequelize.query(
            `CREATE TRIGGER checkActionToContactRelation BEFORE INSERT OR UPDATE ON action_contacts
                FOR EACH ROW EXECUTE PROCEDURE checkActionToContactRelation();`,
        )),

    down: queryInterface => sequelize.query(
        'DROP TRIGGER checkActionToContactRelation ON action_contacts CASCADE;',
    ).then(() => Promise.all([
        queryInterface.dropFunction('checkActionToContactRelation', []),
        queryInterface.dropTable('action_contacts'),
    ])),
};
