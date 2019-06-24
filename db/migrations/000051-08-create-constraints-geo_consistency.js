module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.addConstraint(
        'users',
        ['fk_region', 'fk_departement', 'fk_epci', 'fk_city'],
        {
            type: 'check',
            name: 'check_geo_consistency',
            where: {
                [Sequelize.Op.or]: [
                    {
                        [Sequelize.Op.and]: {
                            fk_region: { [Sequelize.Op.eq]: null },
                            fk_departement: { [Sequelize.Op.eq]: null },
                            fk_epci: { [Sequelize.Op.eq]: null },
                            fk_city: { [Sequelize.Op.eq]: null },
                        },
                    },
                    {
                        [Sequelize.Op.and]: {
                            fk_region: { [Sequelize.Op.ne]: null },
                            fk_departement: { [Sequelize.Op.eq]: null },
                            fk_epci: { [Sequelize.Op.eq]: null },
                            fk_city: { [Sequelize.Op.eq]: null },
                        },
                    },
                    {
                        [Sequelize.Op.and]: {
                            fk_region: { [Sequelize.Op.eq]: null },
                            fk_departement: { [Sequelize.Op.ne]: null },
                            fk_epci: { [Sequelize.Op.eq]: null },
                            fk_city: { [Sequelize.Op.eq]: null },
                        },
                    },
                    {
                        [Sequelize.Op.and]: {
                            fk_region: { [Sequelize.Op.eq]: null },
                            fk_departement: { [Sequelize.Op.eq]: null },
                            fk_epci: { [Sequelize.Op.ne]: null },
                            fk_city: { [Sequelize.Op.eq]: null },
                        },
                    },
                    {
                        [Sequelize.Op.and]: {
                            fk_region: { [Sequelize.Op.eq]: null },
                            fk_departement: { [Sequelize.Op.eq]: null },
                            fk_epci: { [Sequelize.Op.eq]: null },
                            fk_city: { [Sequelize.Op.ne]: null },
                        },
                    },
                ],
            },
        },
    ),

    down: queryInterface => queryInterface.removeConstraint(
        'users',
        'check_geo_consistency',
    ),

};
