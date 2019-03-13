const chai = require('chai');
const chaiSubset = require('chai-subset');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const sinonChai = require('sinon-chai');
const { checkToken } = require('#server/auth');
const { mockReq, mockRes } = require('sinon-express-mock');
const { auth: authConfig } = require('#server/config');

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiSubset);

describe('auth', () => {
    let httpRes;
    let httpReq;
    let response;

    it('.checkToken()', () => {
        describe('if there is no token in the request', () => {
            beforeEach(async () => {
                httpReq = mockReq({});
                httpRes = mockRes();

                checkToken(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with the proper error messages', () => {
                expect(response).to.be.eql({
                    error: {
                        code: 1,
                        user_message: 'Vous devez être connecté pour accéder à ce contenu',
                        developer_message: 'The access token is missing',
                    },
                });
            });
        });

        describe('if the token is not valid', () => {
            beforeEach(async () => {
                httpReq = mockReq({
                    headers: {
                        'x-access-token': global.generate('string'),
                    },
                });
                httpRes = mockRes();

                checkToken(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with the proper error messages', () => {
                expect(response).to.be.eql({
                    error: {
                        code: 2,
                        user_message: 'Votre session a expiré',
                        developer_message: 'The access token is either invalid or expired',
                    },
                });
            });
        });

        describe('if the token is valid but expired', () => {
            beforeEach(async () => {
                httpReq = mockReq({
                    headers: {
                        'x-access-token': jwt.sign({ what: 'ever' }, authConfig.secret, {
                            expiresIn: '1',
                        }),
                    },
                });
                httpRes = mockRes();

                checkToken(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with the proper error messages', () => {
                expect(response).to.be.eql({
                    error: {
                        code: 2,
                        user_message: 'Votre session a expiré',
                        developer_message: 'The access token is either invalid or expired',
                    },
                });
            });
        });

        describe('if the token is fully valid', () => {
            let nextRequestHandler;
            let token;
            beforeEach(async () => {
                token = {
                    data: global.generate('string'),
                };

                httpReq = mockReq({
                    headers: {
                        'x-access-token': jwt.sign(token, authConfig.secret, {
                            expiresIn: '1s',
                        }),
                    },
                });
                httpRes = mockRes();
                nextRequestHandler = sinon.stub();

                checkToken(httpReq, httpRes, nextRequestHandler);
            });

            it('it includes the decoded token into the request', () => {
                expect(httpReq.decoded).to.containSubset(token);
            });

            it('it triggers the next request handler', () => {
                expect(nextRequestHandler).to.have.been.calledOnce;
            });
        });
    });
});
