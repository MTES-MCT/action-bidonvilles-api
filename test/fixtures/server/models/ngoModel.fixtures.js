const randomStr = global.generate('string');
const commonInputs = require('#fixtures/common.fixtures')(randomStr);

module.exports = {
    findAll: {
        inputs: [
            ...commonInputs,
            {
                table: 'ngos',
                rows: [
                    {
                        name: `${randomStr}2`,
                        created_by: 1,
                        updated_by: 1,
                    },
                ],
            },
        ],
        output: [
            {
                id: 1,
                name: randomStr,
            },
            {
                id: 2,
                name: `${randomStr}2`,
            },
        ],
    },

    create: {
        inputs: commonInputs,
    },
};
