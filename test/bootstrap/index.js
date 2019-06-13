require('module-alias/register');

require('./custom-hooks');
require('./random');

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

global.db = () => new Sequelize({
    username: 'fabnum',
    password: 'fabnum',
    database: 'action_bidonvilles_test',
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    logging: false,
});

/**
 * Inserts a set of rows into a table
 *
 * @param {Sequelize}      db    Database connection
 * @param {string}         table Name of the table
 * @param {Array.<Object>} rows  The list of rows to be injected into the table
 *
 * @returns {Promise}
 */
async function insertIntoDb(db, table, rows) {
    const query = `INSERT INTO "${table}" (${Object.keys(rows[0]).join(',')}) VALUES `;
    const values = [];
    const replacements = {};

    rows.forEach((row, index) => {
        const keys = Object.keys(row).map((key) => {
            replacements[`${key}${index}`] = row[key];
            return `:${key}${index}`;
        });

        values.push(`(${keys.join(',')})`);
    });

    await db.query(
        `${query}${values.join(',')}`,
        {
            replacements,
        },
    );
}

/**
 * Inserts all the requested fixtures into the database
 *
 * @param {Sequelize}      db     Database connection
 * @param {Array.<Object>} inputs List of fixtures to be inserted
 */
global.insertFixtures = async function insertFixtures(db, inputs) {
    for (let i = 0; i < inputs.length; i += 1) {
        /* eslint-disable-next-line */
        await insertIntoDb(db, inputs[i].table, inputs[i].rows);
    }
};

/**
 * Generates the name of a class testsuite
 *
 * @param {string} mainTestFile Absolute path to a class's main test file
 *
 * @returns {string}
 */
global.testName = function testName(mainTestFile) {
    const dirname = path.dirname(mainTestFile);
    const baseName = path.basename(mainTestFile);

    return `${dirname.split('/suites/')[1]}/${baseName.split('.')[0]}`;
};

/**
 * Loads all the sub-tests of a testsuite
 *
 * Every tested class (say, "C") is assumed to have its own test directory, inside which
 * should be found:
 * - a file C.spec.js, which declares the testsuite for this class
 * - a set of files C.*.spec.js, which each represent a single method of that class, and the
 *   declare the related sub-tests
 *
 * This method takes the path to a class's test directory, and requires each sub-test file.
 *
 * @param {string} directory Absolute path to a class's test directory
 */
global.loadSuite = function loadSuite(directory) {
    fs
        .readdirSync(directory)
        .filter(file => (file.indexOf('.') !== 0) && /^([^.]+\.){2}spec\.js$/gi.test(file) === true)
        .forEach((file) => {
            /* eslint-disable-next-line */
            require(path.join(directory, file))();
        });
};
