const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const { makeMockModels } = require('sequelize-test-helpers');
const proxyquire = require('proxyquire');
const sequelize = require('sequelize');

const mockModels = Object.assign(
    makeMockModels({
        Shantytown: {},
    }),
    {
        sequelize: Object.assign({
            query: sinon.stub(),
        }, sequelize),
    },
);

const mockShantytownAccess = {
    findAll: sinon.stub(),
};

const { list } = proxyquire('#server/controllers/townController', {
    '../../db/models': mockModels,
})({
    shantytown: mockShantytownAccess,
});

const { expect } = chai;
chai.use(sinonChai);

describe('Controllers/Shantytown', () => {
    let httpRes;
    let httpReq;
    let response;

    describe('.list()', () => {
        describe('if the query succeeds', () => {
            let towns;
            beforeEach(async () => {
                httpReq = mockReq({});
                httpRes = mockRes();
                towns = [global.generate('string'), global.generate('string'), global.generate('string')];
                mockShantytownAccess.findAll.resolves(towns);

                await list(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 200', () => {
                expect(httpRes.status).to.have.been.calledWith(200);
            });

            it('it responds with the proper list of towns', () => {
                expect(response).to.be.eql(towns);
            });
        });

        describe('if the query fails', () => {
            let error;
            beforeEach(async () => {
                httpReq = mockReq({});
                httpRes = mockRes();
                error = global.generate('string');
                mockShantytownAccess.findAll.rejects(new Error(error));

                await list(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 500', () => {
                expect(httpRes.status).to.have.been.calledWith(500);
            });

            it('it responds with the proper error messages', () => {
                expect(response).to.be.eql(error);
            });
        });
    });
});
