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
