const createDescribe = require('./createDescribe');

module.exports = (context) => {
    // eslint-disable-next-line no-param-reassign
    context.describe.model = createDescribe(context.describe, () => {
        prepare(() => {
            returnedValue = undefined;
        });

        afterEach(() => {
            sandbox.reset();
        });
    });
};
