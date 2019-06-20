// ut tools
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiSubset = require('chai-subset');

const { expect } = chai;
chai.use(chaiAsPromised);
chai.use(chaiSubset);

const db = global.db();
const {
    findAll,
    create,
} = require('#server/models/ngoModel')(db);

const fixtures = require('#fixtures/server/models/ngoModel.fixtures');

// tests
describe('[/server/models] ngoModel', () => {
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
        it('it returns all ngos from the database', async () => {
            await global.insertFixtures(db, fixtures.findAll.inputs);
            const ngos = await findAll();
            expect(ngos).to.eql(fixtures.findAll.output);
        });
    });

    describe('.create()', () => {
        let fakeNgo;
        beforeEach(async () => {
            await global.insertFixtures(db, fixtures.create.inputs);

            fakeNgo = {
                name: global.generate('string'),
            };

            await create(fakeNgo, 1);
        });

        it('it inserts a new ngo in the database', async () => {
            const [ngo] = await db.query(
                `SELECT
                    ngos.ngo_id AS id,
                    ngos.name AS name
                FROM ngos WHERE ngo_id = 2`,
                {
                    type: db.QueryTypes.SELECT,
                },
            );

            expect(ngo).to.eql({
                id: 2,
                name: fakeNgo.name,
            });
        });
    });

    describe('.findOneById()', () => {
        it('');
    });

    describe('.findOneByName()', () => {
        it('');
    });
});
