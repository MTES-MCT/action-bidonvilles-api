const randomStr = global.generate('string');

module.exports = {
    findOne: {
        inputs: [
            {
                table: 'users',
                rows: [
                    {
                        email: randomStr,
                        password: randomStr,
                        salt: randomStr,
                        fk_departement: '75',
                        first_name: randomStr,
                        last_name: randomStr,
                        company: randomStr,
                        fk_role: 1,
                    },
                ],
            },
        ],
        output: {
            id: 1,
            email: randomStr,
            departement: '75',
            first_name: randomStr,
            last_name: randomStr,
            company: randomStr,
            permissions: [
                { type: 'feature', name: 'createTown' },
                { type: 'feature', name: 'updateTown' },
                { type: 'feature', name: 'deleteTown' },
                { type: 'feature', name: 'createComment' },
                { type: 'feature', name: 'updateComment' },
                { type: 'feature', name: 'deleteComment' },
            ],
        },
    },
};
