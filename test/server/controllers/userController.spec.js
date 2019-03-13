const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const { makeMockModels } = require('sequelize-test-helpers');
const proxyquire = require('proxyquire');
const crypto = require('crypto');
const { generateAccessTokenFor } = require('#server/utils/auth');

const mockModels = makeMockModels({
    User: {
        findOne: sinon.stub(),
    },
});

const { signin } = proxyquire('#server/controllers/userController', {
    '#db/models': mockModels,
})();

const { expect } = chai;
chai.use(sinonChai);

describe('Controllers/User', () => {
    let httpRes;
    let httpReq;
    let response;

    describe('.signin()', () => {
        describe('if the input email is not a string', () => {
            beforeEach(async () => {
                httpReq = mockReq({
                    body: {
                        email: global.generate().not('string'),
                    },
                });
                httpRes = mockRes();

                await signin(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'L\'adresse e-mail est invalide',
                    developer_message: 'The email address must be a string',
                });
            });
        });

        describe('if the input password is not a string', () => {
            beforeEach(async () => {
                httpReq = mockReq({
                    body: {
                        email: global.generate('string'),
                        password: global.generate().not('string'),
                    },
                });
                httpRes = mockRes();

                await signin(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'Le mot de passe est invalide',
                    developer_message: 'The password must be a string',
                });
            });
        });

        describe('if the input email does not match an existing user', () => {
            beforeEach(async () => {
                httpReq = mockReq({
                    body: {
                        email: global.generate('string'),
                        password: global.generate('string'),
                    },
                });
                httpRes = mockRes();
                mockModels.User.findOne.resolves(null);

                await signin(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 403', () => {
                expect(httpRes.status).to.have.been.calledWith(403);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'Ces identifiants sont incorrects',
                    developer_message: 'The given credentials do not match an existing user',
                });
            });
        });

        describe('if the input password does not match the user\'s password', () => {
            beforeEach(async () => {
                const email = global.generate('string');
                const salt = global.generate('string');

                httpReq = mockReq({
                    body: {
                        email,
                        password: global.generate('string'),
                    },
                });
                httpRes = mockRes();
                mockModels.User.findOne.withArgs({ where: { email } }).resolves({
                    id: global.generate('number'),
                    email,
                    salt,
                    password: global.generate('string'),
                });

                await signin(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 403', () => {
                expect(httpRes.status).to.have.been.calledWith(403);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'Ces identifiants sont incorrects',
                    developer_message: 'The given credentials do not match an existing user',
                });
            });
        });

        describe('if the credentials match an existing user', () => {
            let fakeUser;
            beforeEach(async () => {
                const plainPassword = global.generate('string');
                fakeUser = {
                    id: global.generate('number'),
                    email: global.generate('string'),
                    salt: global.generate('string'),
                };
                fakeUser.password = crypto.pbkdf2Sync(plainPassword, fakeUser.salt, 10000, 512, 'sha512').toString('hex');

                httpReq = mockReq({
                    body: {
                        email: fakeUser.email,
                        password: plainPassword,
                    },
                });
                httpRes = mockRes();
                mockModels.User.findOne.withArgs({ where: { email: fakeUser.email } }).resolves(fakeUser);

                await signin(httpReq, httpRes);
                [response] = httpRes.send.getCalls()[0].args;
            });

            it('it responds with a 200', () => {
                expect(httpRes.status).to.have.been.calledWith(200);
            });

            it('it responds with a success = true', () => {
                expect(response.success).to.be.true;
            });

            it('it responds with a new JWT token', () => {
                expect(response.token).to.be.eql(generateAccessTokenFor(fakeUser));
            });
        });
    });
});
