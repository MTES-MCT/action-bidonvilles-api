// ut tools
const { expect } = require('chai');

const {
    findAll,
} = require('#server/dataAccess/shantytownAccess')(global.db);

const fixtures = require('./shantytownAccess.fixtures');

/**
 * Inserts a set of rows into a table
 *
 * @param {string}         table Name of the table
 * @param {Array.<Object>} rows  The list of rows to be injected into the table
 *
 * @returns {Promise}
 */
async function insert(table, rows) {
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

    await global.db.query(
        `${query}${values.join(',')}`,
        {
            replacements,
        },
    );
}

// tests
describe('[Data Access Layer] Shantytown', () => {
    beforeEach(async () => {
        await Promise.all([
            global.db.query('DELETE FROM shantytowns'),
            global.db.query('ALTER SEQUENCE shantytowns_shantytown_id_seq RESTART WITH 1'),
        ]);
    });

    describe('.findAll()', () => {
        describe('if the database is empty', () => {
            it('it returns an empty array', async () => {
                const towns = await findAll();
                expect(towns).to.eql([]);
            });
        });

        describe('if the database is not empty', () => {
            beforeEach(async () => {
                for (let i = 0; i < fixtures.findAll.input.length; i += 1) {
                    const input = fixtures.findAll.input[i];
                    // eslint-disable-next-line
                    await insert(input.table, input.rows);
                }
            });

            it('it returns all towns from the database', async () => {
                const towns = await findAll();
                expect(towns).to.eql(fixtures.findAll.expectedOutput);
            });
        });
    });
});
