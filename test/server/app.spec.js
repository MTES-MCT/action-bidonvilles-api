const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const appConstructor = require('#server/app');

const { expect } = chai;
chai.use(chaiHttp);

function mockController() {
    return sinon.stub().callsFake((req, res) => res.status(200).send({}));
}

function getFakeControllers() {
    return {
        user: {
            edit: mockController(),
            me: mockController(),
            renewToken: mockController(),
            signin: mockController(),
            signup: mockController(),
        },
        auth: {
            checkToken: sinon.stub().callsFake((req, res, next) => {
                next();
            }),
        },
        config: {
            list: mockController(),
        },
        town: {
            add: mockController(),
            addComment: mockController(),
            close: mockController(),
            delete: mockController(),
            edit: mockController(),
            find: mockController(),
            list: mockController(),
        },
        action: {
            add: mockController(),
            addStep: mockController(),
            delete: mockController(),
            edit: mockController(),
            find: mockController(),
            list: mockController(),
        },
        geo: {
            search: mockController(),
            searchCities: mockController(),
            searchEpci: mockController(),
        },
    };
}

function getFakeApp(controllers) {
    return appConstructor(controllers);
}

describe('app', () => {
    let app;
    let controllers;

    describe('POST /signin', () => {
        beforeEach(async () => {
            controllers = getFakeControllers();
            app = getFakeApp(controllers);

            await chai.request(app).post('/signin');
        });

        it('it should map to userController.signin', () => {
            expect(controllers.user.signin).to.have.been.calledOnce;
        });
    });

    describe('GET /towns', () => {
        beforeEach(async () => {
            controllers = getFakeControllers();
            app = getFakeApp(controllers);

            await chai.request(app).get('/towns');
        });

        it('it should require a token', () => {
            expect(controllers.auth.checkToken).to.have.been.calledOnce;
        });

        it('it should map to townController.list', () => {
            expect(controllers.town.list).to.have.been.calledOnce;
        });
    });

    describe('GET /towns/:id', () => {
        beforeEach(async () => {
            controllers = getFakeControllers();
            app = getFakeApp(controllers);

            await chai.request(app).get('/towns/123');
        });

        it('it should require a token', () => {
            expect(controllers.auth.checkToken).to.have.been.calledOnce;
        });

        it('it should map to townController.find', () => {
            expect(controllers.town.find).to.have.been.calledOnce;
        });
    });
});
