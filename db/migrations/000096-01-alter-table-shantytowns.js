const regularComment = 'L\'accès à l\'électricité est régulier.';
const irregularComment = 'L\'accès à l\'électricité est irrégulier.';
const yesLabel = 'Oui';
const regularLabel = 'Oui (Accès régulier)';
const irregularLabel = 'Oui (Accès irrégulier)';

module.exports = {
    up: queryInterface => queryInterface.sequelize.query('SELECT electricity_type_id as id, label FROM electricity_types', {
        type: queryInterface.sequelize.QueryTypes.SELECT,
    }).then((data) => {
        const yes = data.find(d => d.label === yesLabel);
        const yesRegular = data.find(d => d.label === regularLabel);
        const yesIrregular = data.find(d => d.label === irregularLabel);

        if (!yes || !yesRegular || !yesIrregular) {
            throw new Error('Electricity types should exist');
        }

        // Add comments
        return queryInterface.sequelize.transaction(transaction => Promise.all([
            // Update Oui (acces régulier)
            queryInterface.sequelize.query(
                'UPDATE shantytowns SET electricity_comments = :comment WHERE fk_electricity_type = :id',
                {
                    transaction,
                    replacements: { comment: regularComment, id: yesRegular.id },
                },
            ),
            queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET electricity_comments = :comment WHERE fk_electricity_type = :id',
                {
                    transaction,
                    replacements: { comment: regularComment, id: yesRegular.id },
                },
            ),
            // Update Oui (acces irrégulier)
            queryInterface.sequelize.query(
                'UPDATE shantytowns SET electricity_comments = :comment WHERE fk_electricity_type = :id',
                {
                    transaction,
                    replacements: { comment: irregularComment, id: yesIrregular.id },
                },
            ),
            queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET electricity_comments = :comment WHERE fk_electricity_type = :id',
                {
                    transaction,
                    replacements: { comment: irregularComment, id: yesIrregular.id },
                },
            ),
            queryInterface.sequelize.query(
                'UPDATE shantytowns SET fk_electricity_type = :idYes where fk_electricity_type IN (:idRegular, :idIrregular)',
                {
                    transaction,
                    replacements: { idYes: yes.id, idRegular: yesRegular.id, idIrregular: yesIrregular.id },
                },
            ),
            queryInterface.sequelize.query(
                'UPDATE "ShantytownHistories" SET fk_electricity_type = :idYes where fk_electricity_type IN (:idRegular, :idIrregular)',
                {
                    transaction,
                    replacements: { idYes: yes.id, idRegular: yesRegular.id, idIrregular: yesIrregular.id },
                },
            ),
        ]))
            // This needs to be outside of the transaction or it breaks the foreign key condition
            .then(() => queryInterface.sequelize.query(
                'DELETE FROM electricity_types WHERE electricity_type_id IN (:idRegular, :idIrregular)',
                {
                    replacements: { idRegular: yesRegular.id, idIrregular: yesIrregular.id },
                },
            ));
    }),


    down: queryInterface => queryInterface.sequelize.transaction(
        // Insert back Oui (acces régulier and acces irrégulier)
        transaction => queryInterface.bulkInsert('electricity_types', [{ label: regularLabel }, { label: irregularLabel }], { transaction }),
    ).then(() => queryInterface.sequelize.transaction(
        transaction => queryInterface.sequelize.query('SELECT electricity_type_id as id, label FROM electricity_types', {
            type: queryInterface.sequelize.QueryTypes.SELECT,
        }).then((data) => {
            const yesRegular = data.find(d => d.label === regularLabel);
            const yesIrregular = data.find(d => d.label === irregularLabel);

            if (!yesRegular || !yesIrregular) {
                throw new Error('Electricity types should exist');
            }

            return Promise.all([
                queryInterface.sequelize.query(
                    'UPDATE shantytowns SET fk_electricity_type = :id where electricity_comments = :comment',
                    {
                        transaction,
                        replacements: { comment: regularComment, id: yesRegular.id },
                    },
                ),
                queryInterface.sequelize.query(
                    'UPDATE "ShantytownHistories" SET fk_electricity_type = :id where electricity_comments = :comment',
                    {
                        transaction,
                        replacements: { comment: regularComment, id: yesRegular.id },
                    },
                ),
                queryInterface.sequelize.query(
                    'UPDATE shantytowns SET fk_electricity_type = :id where electricity_comments = :comment',
                    {
                        transaction,
                        replacements: { comment: irregularComment, id: yesIrregular.id },
                    },
                ),
                queryInterface.sequelize.query(
                    'UPDATE "ShantytownHistories" SET fk_electricity_type = :id where electricity_comments = :comment',
                    {
                        transaction,
                        replacements: { comment: irregularComment, id: yesIrregular.id },
                    },
                ),
            ])
                .then(() => Promise.all([
                    queryInterface.sequelize.query(
                        'UPDATE shantytowns SET electricity_comments = NULL where electricity_comments IN (:comment, :comment2)',
                        {
                            transaction,

                            replacements: { comment: irregularComment, comment2: regularComment },
                        },
                    ),
                    queryInterface.sequelize.query(
                        'UPDATE "ShantytownHistories" SET electricity_comments = NULL where electricity_comments IN (:comment, :comment2)',
                        {
                            transaction,

                            replacements: { comment: irregularComment, comment2: regularComment },
                        },
                    ),
                ]));
        }),
    )),

};
