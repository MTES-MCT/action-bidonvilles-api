// ut tools
const { expect } = require('chai');

const db = global.db();
const {
    findAll,
} = require('#server/models/departementModel')(db);

const fixtures = require('#fixtures/server/models/departementModel.fixtures');

// tests
describe('[/server/models] departementModel', () => {
    before(async () => {
        await db.authenticate();
    });

    after(async () => {
        await db.close();
    });

    beforeEach(async () => {
        await Promise.all([
            db.query('SELECT truncate_tables(\'fabnum\')'),
            db.query('SELECT reset_sequences()'),
        ]);
    });

    describe('.findAll()', () => {
        it('it returns all departements from the database', async () => {
            await global.insertFixtures(db, fixtures.findAll.inputs);
            const departements = await findAll();
            expect(departements).to.eql(fixtures.findAll.output);
        });
    });
});
