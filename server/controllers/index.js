const fs = require('fs');
const path = require('path');
const { sequelize } = require('#db/models');
const dataAccess = require('#server/dataAccess')(sequelize);

const basename = path.basename(module.filename);
const controllers = {};

// instanciate all controllers
fs
    .readdirSync(__dirname)
    .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
        /* eslint-disable-next-line */
        controllers[file.replace('Controller.js', '')] = require(path.join(__dirname, file))(dataAccess);
    });

module.exports = controllers;
