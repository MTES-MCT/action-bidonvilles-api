// ut tools
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { expect } = chai;
chai.use(chaiAsPromised);

const db = global.db();
const {
    findOne,
    setDefaultExport,
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

        describe('if the user\'s default_export is null', () => {
            it('it returns an empty array as default_export', async () => {
                await global.insertFixtures(db, fixtures.findOneWithoutDefaultExport.inputs);
                const { default_export } = await findOne(2);
                expect(default_export).to.be.eql([]);
            });
        });
    });

    describe('.setDefaultExport()', () => {
        beforeEach(async () => {
            await global.insertFixtures(db, fixtures.setDefaultExport.inputs);
        });

        describe('if the user id is missing', () => {
            it('it throws an exception', async () => {
                await expect(setDefaultExport()).to.be.rejectedWith('The user id is missing');
            });
        });

        describe('if the new default-export value is missing', () => {
            it('it throws an exception', async () => {
                await expect(setDefaultExport(global.generate('number'))).to.be.rejectedWith('The new default-export value is missing');
            });
        });

        describe('if the user id does not match an existing user', () => {
            it('it throws an exception', async () => {
                const randomUserId = global.generate('number');
                await expect(setDefaultExport(randomUserId, 'whatever')).to.be.rejectedWith(`The user #${randomUserId} does not exist`);
            });
        });

        [
            { label: 'string', value: 'something', expect: ['something'] },
            { label: 'null value', value: null, expect: [] },
        ].forEach(({ label, value, expect: expectedValue }) => {
            it(`it updates the default-export of the user with the given ${label}`, async () => {
                await setDefaultExport(1, value);
                const { default_export } = await findOne(1);
                expect(default_export).to.eql(expectedValue);
            });
        });

        describe('if the given export value is an empty string', () => {
            it('it stores it as NULL value', async () => {
                await setDefaultExport(1, '     ');
                const { default_export } = await findOne(1);
                expect(default_export).to.eql([]);
            });
        });
    });
});
