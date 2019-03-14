// ut tools
const { expect } = require('chai');

const db = global.db();
const {
    findOne,
} = require('#server/models/userModel')(db);

const dataSets = require('./userModel.fixtures');

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

    await db.query(
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
describe('[Models] User', () => {
    before(async () => {
        await db.authenticate();
    });

    after(async () => {
        await db.close();
    });

    beforeEach(async () => {
        await Promise.all([
            db.query('DELETE FROM users'),
            db.query('ALTER SEQUENCE users_user_id_seq RESTART WITH 1'),
        ]);
    });

    describe('.findOne()', () => {
        describe('if the id matches an existing user', () => {
            beforeEach(async () => {
                await insertFixtures(dataSets.findOne.inputs);
            });

            it('it returns the proper user from the database', async () => {
                const user = await findOne(1);
                expect(user).to.eql(dataSets.findOne.output);
            });
        });

        describe('if the id does not match an existing user', () => {
            it('it returns null', async () => {
                const user = await findOne(1);
                expect(user).to.be.null;
            });
        });
    });
});
