const randomStr = global.generate('string');
const commonInputs = require('#fixtures/common.fixtures')(randomStr);

module.exports = {
    findOne: {
        inputs: commonInputs,
        output: {
            id: 1,
            email: randomStr,
            departement: '75',
            map_center: [25, 10],
            first_name: randomStr,
            last_name: randomStr,
            company: randomStr,
            permissions: {
                feature: [
                    'createTown',
                    'updateTown',
                    'deleteTown',
                    'createComment',
                    'updateComment',
                    'deleteComment',
                ],
                data: [],
            },
            default_export: [randomStr, randomStr, randomStr],
        },
    },

    findOneWithoutDefaultExport: {
        inputs: [
            ...commonInputs,
            {
                table: 'users',
                rows: [
                    {
                        email: global.generate('string'),
                        password: randomStr,
                        salt: randomStr,
                        fk_departement: '75',
                        first_name: randomStr,
                        last_name: randomStr,
                        company: randomStr,
                        default_export: null,
                        fk_role: 1,
                    },
                ],
            },
        ],
    },

    setDefaultExport: {
        inputs: commonInputs,
    },
};
