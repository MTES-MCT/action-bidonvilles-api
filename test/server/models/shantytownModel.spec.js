// ut tools
const { expect } = require('chai');

const db = global.db();
const {
    findAll,
    findOne,
} = require('#server/models/shantytownModel')(db);

const dataSets = require('./shantytownModel.fixtures');

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
describe.only('[Models] Shantytown', () => {
    const allPermissions = [
        'priority',
        'declaredAt',
        'builtAt',
        'closedAt',
        'address',
        'addressDetails',
        'populationTotal',
        'populationCouples',
        'populationMinors',
        'accessToElectricity',
        'accessToWater',
        'trashEvacuation',
        'owner',
        'censusStatus',
        'censusConductedBy',
        'censusConductedAt',
        'ownerComplaint',
        'justiceProcedure',
        'justiceRendered',
        'justiceRenderedAt',
        'justiceRenderedBy',
        'justiceChallenged',
        'policeStatus',
        'policeRequestedAt',
        'policeGrantedAt',
        'bailiff',
        'socialOrigins',
        'comments',
        'closingSolutions',
        'city',
        'epci',
        'departement',
        'fieldType',
        'ownerType',
        'actions',
        'updatedAt',
    ];

    before(async () => {
        await db.authenticate();
    });

    after(async () => {
        await db.close();
    });

    beforeEach(async () => {
        await Promise.all([
            db.query('DELETE FROM shantytowns'),
            db.query('DELETE FROM users'),
            db.query('ALTER SEQUENCE users_user_id_seq RESTART WITH 1'),
            db.query('ALTER SEQUENCE shantytowns_shantytown_id_seq RESTART WITH 1'),
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
                await insertFixtures(dataSets.findAll.inputs);
            });

            describe('if all permissions are passed', () => {
                it('it returns all towns from the database, with all details', async () => {
                    const towns = await findAll(allPermissions);
                    expect(towns).to.eql(dataSets.findAll.outputWithAllPermissions);
                });
            });

            describe('if no permissions are passed', () => {
                it('it returns all towns from the database, without details', async () => {
                    const towns = await findAll();
                    expect(towns).to.eql(dataSets.findAll.outputWithNoPermissions);
                });
            });
        });
    });

    describe('.findOne()', () => {
        describe('if the id matches an existing town', () => {
            beforeEach(async () => {
                await insertFixtures(dataSets.findOne.inputs);
            });

            describe('if all permissions are passed', () => {
                it('it returns the proper town from the database, with all details', async () => {
                    const town = await findOne(1, allPermissions);
                    expect(town).to.eql(dataSets.findOne.outputWithAllPermissions);
                });
            });

            describe('if no permissions are passed', () => {
                it('it returns the proper town from the database, without details', async () => {
                    const towns = await findOne(1);
                    expect(towns).to.eql(dataSets.findOne.outputWithNoPermissions);
                });
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
