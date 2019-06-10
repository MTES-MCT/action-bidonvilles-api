const fs = require('fs');
const path = require('path');

module.exports = (models) => {
    const basename = path.basename(module.filename);
    const controllers = {};

    /**
     * Unifies all sub-files of a controller directory into a single object
     *
     * Considering the following directory:
     * /> myController
     *      /> myController.methodA.js
     *      /> myController.methodB.js
     *
     * Calling this method with the absolute path to /myController will
     * result into the following object:
     * {
     *      'methodA': "exported content of /myController/myController.methodA.js"
     *      'methodB': "exported content of /myController/myController.methodB.js"
     * }
     *
     * Hope this helps clarify.
     * Why so complicated? Legacy reasons essentially, and lake of time to simplify it all.
     *
     * @param {String} dirPath Absolute path to a controller directory
     *
     * @returns {Object}
     */
    function loadSplitController(dirPath) {
        return fs
            .readdirSync(dirPath)
            .filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js')
            .reduce((acc, file) => {
                const [, methodName] = file.split('.');

                return Object.assign({}, acc, {
                    /* eslint-disable-next-line import/no-dynamic-require, global-require */
                    [methodName]: require(path.join(dirPath, file))(models),
                });
            }, {});
    }

    // instanciate all controllers
    fs
        .readdirSync(__dirname)
        .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
        .forEach((file) => {
            /* eslint-disable-next-line */
            controllers[file.replace('Controller.js', '')] = require(path.join(__dirname, file))(models);
        });

    // instanciate "split controllers"
    fs
        .readdirSync(__dirname, {
            withFileTypes: true,
        })
        .filter(dirent => dirent.isDirectory() && dirent.name.indexOf('.') !== 0)
        .forEach((dirent) => {
            controllers[dirent.name] = loadSplitController(path.join(__dirname, dirent.name));
        });

    return controllers;
};
