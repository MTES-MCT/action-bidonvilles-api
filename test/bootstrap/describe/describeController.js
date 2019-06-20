const createDescribe = require('./createDescribe');

module.exports = (context) => {
    // eslint-disable-next-line no-param-reassign
    context.describe.controller = createDescribe(context.describe, () => {
        prepare(() => {
            req = {
                body: {},
            };
            sentData = null;
        });

        collect(() => {
            const calls = res.send.getCalls();
            if (calls.length > 0) {
                [sentData] = calls[0].args;
            }
        });

        afterEach(() => {
            sandbox.reset();
        });
    });
};
