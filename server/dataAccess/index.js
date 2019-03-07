const fs = require('fs');
const path = require('path');

const basename = path.basename(module.filename);
const dataAccess = {};

fs
    .readdirSync(__dirname)
    .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
        dataAccess[file.replace('Access.js')] = path.join(__dirname, file);
    });

module.exports = dataAccess;
