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
        },
    },
};
