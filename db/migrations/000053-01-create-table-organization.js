module.exports = {

    up: (queryInterface, Sequelize) => {
        const { Op } = Sequelize;

        return queryInterface.sequelize.transaction(
            t => queryInterface.createTable(
                'organizations',
                {
                    organization_id: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        primaryKey: true,
                        autoIncrement: true,
                    },
                    name: {
                        type: Sequelize.STRING,
                        allowNull: false,
                    },
                    fk_organization_type: {
                        type: Sequelize.STRING,
                        allowNull: false,
                    },
                    fk_region: {
                        type: Sequelize.STRING(2),
                        allowNull: true,
                    },
                    fk_departement: {
                        type: Sequelize.STRING(3),
                        allowNull: true,
                    },
                    fk_epci: {
                        type: Sequelize.STRING(9),
                        allowNull: true,
                    },
                    fk_city: {
                        type: Sequelize.STRING(5),
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
                        allowNull: true,
                        defaultValue: null,
                        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
                    },
                    updated_by: {
                        type: Sequelize.INTEGER,
                        allowNull: true,
                    },
                },
                {
                    transaction: t,
                },
            )
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_organization_type'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_organization_type',
                        references: {
                            table: 'organization_types',
                            field: 'uid',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_region'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_region',
                        references: {
                            table: 'regions',
                            field: 'code',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_departement'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_departement',
                        references: {
                            table: 'departements',
                            field: 'code',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_epci'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_epci',
                        references: {
                            table: 'epci',
                            field: 'code',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_city'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_city',
                        references: {
                            table: 'cities',
                            field: 'code',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['created_by'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_creator',
                        references: {
                            table: 'users',
                            field: 'user_id',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['updated_by'],
                    {
                        type: 'foreign key',
                        name: 'fk_organizations_editor',
                        references: {
                            table: 'users',
                            field: 'user_id',
                        },
                        onUpdate: 'cascade',
                        onDelete: 'restrict',
                        transaction: t,
                    },
                ))
                .then(() => queryInterface.addConstraint(
                    'organizations',
                    ['fk_region', 'fk_departement', 'fk_epci', 'fk_city'],
                    {
                        type: 'check',
                        name: 'check_geographic_level',
                        where: {
                            [Op.or]: [
                                {
                                    [Op.and]: {
                                        fk_region: { [Op.eq]: null },
                                        fk_departement: { [Op.eq]: null },
                                        fk_epci: { [Op.eq]: null },
                                        fk_city: { [Op.eq]: null },
                                    },
                                },
                                {
                                    [Op.and]: {
                                        fk_region: { [Op.ne]: null },
                                        fk_departement: { [Op.eq]: null },
                                        fk_epci: { [Op.eq]: null },
                                        fk_city: { [Op.eq]: null },
                                    },
                                },
                                {
                                    [Op.and]: {
                                        fk_region: { [Op.eq]: null },
                                        fk_departement: { [Op.ne]: null },
                                        fk_epci: { [Op.eq]: null },
                                        fk_city: { [Op.eq]: null },
                                    },
                                },
                                {
                                    [Op.and]: {
                                        fk_region: { [Op.eq]: null },
                                        fk_departement: { [Op.eq]: null },
                                        fk_epci: { [Op.ne]: null },
                                        fk_city: { [Op.eq]: null },
                                    },
                                },
                                {
                                    [Op.and]: {
                                        fk_region: { [Op.eq]: null },
                                        fk_departement: { [Op.eq]: null },
                                        fk_epci: { [Op.eq]: null },
                                        fk_city: { [Op.ne]: null },
                                    },
                                },
                            ],
                        },
                        transaction: t,
                    },
                )),
        );
    },

    down: queryInterface => queryInterface.dropTable('organizations'),

};
