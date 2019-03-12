const fs = require('fs');
const path = require('path');

module.exports = (database) => {
    const basename = path.basename(module.filename);
    const dataAccess = {};

    fs
        .readdirSync(__dirname)
        .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
        .forEach((file) => {
            /* eslint-disable-next-line */
            dataAccess[file.replace('Access.js', '')] = require(path.join(__dirname, file))(database);
        });

    return dataAccess;
};
