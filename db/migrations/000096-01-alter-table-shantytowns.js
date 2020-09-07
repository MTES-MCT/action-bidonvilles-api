const regularAccess = 'L\'accès à l\'électricité est régulier.';
const irregularAccess = 'L\'accès à l\'électricité est irrégulier.';

module.exports = {
    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        // Update Oui (acces régulier)
        transaction => queryInterface.sequelize.query(
            'UPDATE shantytowns SET electricity_comments = :value WHERE fk_electricity_type = 4',
            {
                transaction,
                replacements: { value: regularAccess },
            },
        )
            .then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET electricity_comments = :value where fk_electricity_type = 4',
                {
                    transaction,
                    replacements: { value: regularAccess },
                },

            ))

            // Update Oui (acces irrégulier)
            .then(() => queryInterface.sequelize.query(
                'UPDATE shantytowns SET electricity_comments = :value where fk_electricity_type = 5',
                {
                    transaction,
                    replacements: { value: irregularAccess },
                },
            ))
            .then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET electricity_comments = :value where fk_electricity_type = 5',
                {
                    transaction,
                    replacements: { value: irregularAccess },
                },
            ))
            // Update Reference to Oui
            .then(() => queryInterface.sequelize.query(
                'UPDATE shantytowns SET fk_electricity_type = 3 where fk_electricity_type = 4 OR fk_electricity_type = 5',
                {
                    transaction,
                },
            ))
            .then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET fk_electricity_type = 3 where fk_electricity_type = 4 OR fk_electricity_type = 5',
                {
                    transaction,
                },
            ))
            // Delete Oui (régulier) and oui (irrégulier)
            .then(() => queryInterface.sequelize.query(
                'DELETE FROM electricity_types WHERE electricity_type_id = 4 OR electricity_type_id = 5',
                {
                    transaction,
                },
            )),


    ),

    down: queryInterface => queryInterface.sequelize.transaction(
        // Insert back Oui (acces régulier and acces irrégulier)
        transaction => queryInterface.sequelize.query(
            'INSERT INTO electricity_types(electricity_type_id, label) VALUES (4, :value)',
            {
                transaction,
                replacements: { value: 'Oui (Accès régulier)' },
            },
        )
            .then(() => queryInterface.sequelize.query(
                'INSERT INTO electricity_types(electricity_type_id, label) VALUES (5, :value)',
                {
                    transaction,
                    replacements: { value: 'Oui (Accès irrégulier)' },
                },
            ))
            // Update value where acces régulier
            .then(() => queryInterface.sequelize.query(
                'UPDATE shantytowns SET fk_electricity_type = 4 where electricity_comments = :value',
                {
                    transaction,
                    replacements: { value: regularAccess },
                },
            )).then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET fk_electricity_type = 4 where electricity_comments = :value',
                {
                    transaction,
                    replacements: { value: regularAccess },
                },
            ))
            // Update value where acces irrégulier
            .then(() => queryInterface.sequelize.query(
                'UPDATE shantytowns SET fk_electricity_type = 5 where electricity_comments = :value',
                {
                    transaction,
                    replacements: { value: irregularAccess },
                },
            ))
            .then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET fk_electricity_type = 5 where electricity_comments = :value',
                {
                    transaction,
                    replacements: { value: irregularAccess },
                },
            ))
            // Delete comments where comments match Acces régulier or Irrégulier
            .then(() => queryInterface.sequelize.query(
                'UPDATE shantytowns SET electricity_comments = NULL where electricity_comments = :value OR electricity_comments = :value2',
                {
                    transaction,
                    replacements: { value: irregularAccess, value2: regularAccess },
                },
            ))
            .then(() => queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET electricity_comments = NULL where electricity_comments = :value OR electricity_comments = :value2',
                {
                    transaction,
                    replacements: { value: irregularAccess, value2: regularAccess },
                },
            )),
    ),


};
