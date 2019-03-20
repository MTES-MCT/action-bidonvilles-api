// ut tools
const { expect } = require('chai');

const db = global.db();
const {
    findOne,
} = require('#server/models/userModel')(db);

const fixtures = require('#fixtures/server/models/userModel.fixtures');

// tests
describe('[/server/models] userModel', () => {
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

    describe('.findOne()', () => {
        describe('if the id matches an existing user', () => {
            it('it returns the proper user from the database', async () => {
                await global.insertFixtures(db, fixtures.findOne.inputs);
                const user = await findOne(1);
                expect(user).to.eql(fixtures.findOne.output);
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
