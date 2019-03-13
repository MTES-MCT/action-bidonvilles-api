// ut tools
const { expect } = require('chai');

const {
    findAll,
    findOne,
} = require('#server/middleware/shantytownMiddleware')(global.db);

const dataSets = require('./shantytownMiddleware.fixtures');

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

/**
 * Inserts all the requested fixtures into the database
 */
async function insertFixtures(inputs) {
    for (let i = 0; i < inputs.length; i += 1) {
        /* eslint-disable-next-line */
        await insert(inputs[i].table, inputs[i].rows);
    }
}

// tests
describe('[Middleware] Shantytown', () => {
    beforeEach(async () => {
        await Promise.all([
            global.db.query('DELETE FROM shantytowns'),
            global.db.query('ALTER SEQUENCE shantytowns_shantytown_id_seq RESTART WITH 1'),
        ]);
    });

    after(async () => {
        await global.db.close();
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
                await insertFixtures(dataSets.findAll.inputs);
            });

            it('it returns all towns from the database', async () => {
                const towns = await findAll();
                expect(towns).to.eql(dataSets.findAll.output);
            });
        });
    });

    describe('.findOne()', () => {
        describe('if the id matches an existing town', () => {
            beforeEach(async () => {
                await insertFixtures(dataSets.findOne.inputs);
            });

            it('it returns the proper town from the database', async () => {
                const town = await findOne(1);
                expect(town).to.eql(dataSets.findOne.output);
            });
        });

        describe('if the id does not match an existing town', () => {
            it('it returns null', async () => {
                const town = await findOne(1);
                expect(town).to.be.null;
            });
        });
    });
});
