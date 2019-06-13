/* eslint-disable prefer-arrow-callback, no-param-reassign, func-names */

/**
 * This files enriches the vanilla Mocha with
 * custom hooks:
 * - prepare
 * - build
 * - execute
 *
 * These hooks can be used in the same way as a beforeEach hook:
 * ```
 * prepare(() => { console.log('my prepare hook'); })
 * ```
 *
 * These hooks are basically before-each hooks that are executed
 * in a specific order:
 * - all prepare hooks first
 * - then all build hooks
 * - then all execute hooks
 * - finally all beforeEach hooks
 *
 * Here is a full example:
 * ```
 * describe('Example', () => {
 *     prepare(() => {
 *          console.log('top-level prepare');
 *     });
 *
 *     build(() => {
 *          console.log('top-level build');
 *     });
 *
 *     beforeEach(() => {
 *          console.log('top-level before-each');
 *     });
 *
 *     it('test1', () => {});
 *
 *     describe('group', () => {
 *         prepare(() => {
 *             console.log('group-level prepare');
 *         });
 *
 *         build(() => {
 *             console.log('group-level build');
 *         });
 *
 *         beforeEach(() => {
 *             console.log('group-level before-each');
 *         });
 *
 *         it('test2', () => {});
 *     });
 * });
 * ```
 *
 * With that example, you would have the following output:
 * - top-level prepare
 * - top-level build
 * - top-level before-each
 * - test1
 *
 * - top-level prepare
 * - group-level prepare
 * - top-level build
 * - group-level build
 * - top-level before-each
 * - group-level before-each
 * - test2
 */
const { Runner, Suite, interfaces } = require('mocha');

/**
 * Custom hooks to be declared, and in the expected call order
 *
 * @type {Array.<string>}
 */
const customHooks = ['prepare', 'build', 'execute'];

/**
 * Custom hook
 *
 * @param {string}   name  Name of the custom hook
 * @param {string}   [title]
 * @param {Function} fn
 *
 * @returns {Suite} for chaining
 */
function customHook(name, title, fn) {
    if (this.isPending()) {
        return this;
    }
    if (typeof title === 'function') {
        fn = title;
        title = fn.name;
    }
    title = `"${name}" hook${title ? `: ${title}` : ''}`;

    // eslint-disable-next-line no-underscore-dangle
    const hook = this._createHook(title, fn);
    if (!this[`_${name}`]) {
        this[`_${name}`] = [];
    }
    this[`_${name}`].push(hook);
    this.emit('beforeEach', hook);
    return this;
}

// ensure the custom hooks haven't already been declared
if (!Suite.prototype.customHooked) {
    // declare the custom-hooks in the bdd interface
    const originalBdd = interfaces.bdd;
    interfaces.bdd = function (suite) {
        originalBdd(suite);

        suite.on('pre-require', function (context) {
            customHooks.forEach(function (hookName) {
                context[hookName] = function (name, fn) {
                    suite[hookName](name, fn);
                };
            });
        });
    };

    // return an empty array for custom hooks
    const originalGetHooks = Suite.prototype.getHooks;
    Suite.prototype.getHooks = function getHooks(name) {
        return originalGetHooks.call(this, name) || [];
    };

    // ensure the references for the custom hooks are cleared
    const originalCleanReferences = Suite.prototype.cleanReferences;
    Suite.prototype.cleanReferences = function cleanReferences() {
        function cleanArrReferences(arr) {
            for (let i = 0; i < arr.length; i += 1) {
                delete arr[i].fn;
            }
        }

        customHooks.forEach(function (hookName) {
            if (Array.isArray(this[`_${hookName}`])) {
                cleanArrReferences(this[`_${hookName}`]);
            }
        });

        return originalCleanReferences.call(this);
    };

    customHooks.forEach(function (hookName) {
        Suite.prototype[hookName] = function (title, fn) {
            return customHook.call(this, hookName, title, fn);
        };
    });

    // make hook runner to run custom hooks before before-each
    const originalHooks = Runner.prototype.hooks;
    Runner.prototype.beforeHooks = function beforeHooks(suites, fn) {
        const self = this;
        const remainingHooks = customHooks.slice(0);

        function nextCustomHook() {
            self.hooks(remainingHooks.shift(), suites.slice(0), function (err, errSuite) {
                if (err) {
                    fn(err, errSuite);
                } else if (remainingHooks.length > 0) {
                    nextCustomHook();
                } else {
                    originalHooks.call(self, 'beforeEach', suites, fn);
                }
            });
        }

        nextCustomHook();
    };
    Runner.prototype.hooks = function hooks(name, suites, fn) {
        if (name === 'beforeEach') {
            return this.beforeHooks(suites, fn);
        }

        return originalHooks.call(this, name, suites, fn);
    };

    // mark custom hooks as declared
    Suite.prototype.customHooked = true;
}
