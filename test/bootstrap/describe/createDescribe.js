/* eslint-disable func-names */

module.exports = (describe, cb) => {
    const caller = (method, title, fn) => {
        // eslint-disable-next-line prefer-arrow-callback
        method(title, function () {
            cb.call(this);
            fn.call(this);
        });
    };

    const customDescribe = (...args) => {
        caller(describe, ...args);
    };

    Object.keys(describe).forEach((method) => {
        customDescribe[method] = (...args) => {
            caller(describe[method], ...args);
        };
    });

    return customDescribe;
};
