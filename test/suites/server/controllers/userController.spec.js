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

// @todo: i promise this madness of "mockModels" here, "otherMockModels" there won't last for long...
const otherMockModels = {
    user: {
        setDefaultExport: sinon.stub(),
    },
};

const { signin, me, setDefaultExport } = proxyquire('#server/controllers/userController', {
    '#db/models': mockModels,
})(otherMockModels);

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

    describe('.me()', () => {
        let fakeUser;
        beforeEach(async () => {
            const fakeId = global.generate('number');
            fakeUser = {
                id: fakeId,
                email: global.generate('string'),
                salt: global.generate('string'),
                password: global.generate('string'),
            };
            httpReq = mockReq({
                user: fakeUser,
            });
            httpRes = mockRes();

            await me(httpReq, httpRes);
            [response] = httpRes.send.getCalls()[0].args;
        });

        it('it responds with a 200', () => {
            expect(httpRes.status).to.have.been.calledWith(200);
        });

        it('it responds with the current user', () => {
            expect(response).to.be.eql(fakeUser);
        });
    });

    describe('.setDefaultExport()', () => {
        let fakeUser;
        beforeEach(async () => {
            const fakeId = global.generate('number');
            fakeUser = {
                id: fakeId,
                email: global.generate('string'),
                salt: global.generate('string'),
                password: global.generate('string'),
            };
        });

        async function request(body) {
            httpReq = mockReq({
                user: fakeUser,
                body,
            });
            httpRes = mockRes();

            await setDefaultExport(httpReq, httpRes);
            [response] = httpRes.send.getCalls()[0].args;
        }

        describe('if there is not export value in the body', () => {
            beforeEach(async () => {
                await request({});
            });

            it('it responds with a 400', () => {
                expect(httpRes.status).to.have.been.calledWith(400);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'Les nouvelles préférences d\'export sont manquantes',
                    developer_message: 'The new default export value is missing',
                });
            });
        });

        describe('if the query fails', () => {
            let error;
            beforeEach(async () => {
                const fakeExport = global.generate('string');
                error = global.generate('string');
                otherMockModels.user.setDefaultExport.withArgs(fakeUser.id, fakeExport).rejects(new Error(error));

                await request({
                    export: fakeExport,
                });
            });

            it('it responds with a 500', () => {
                expect(httpRes.status).to.have.been.calledWith(500);
            });

            it('it responds with a success = false', () => {
                expect(response.success).to.be.false;
            });

            it('it responds with the proper error messages', () => {
                expect(response.error).to.be.eql({
                    user_message: 'La sauvegarde de vos préférences a échoué',
                    developer_message: `Failed to store the new default-export into database: ${error}`,
                });
            });
        });

        describe('if the query succeeds', () => {
            beforeEach(async () => {
                const fakeExport = global.generate('string');
                otherMockModels.user.setDefaultExport.withArgs(fakeUser.id, fakeExport).resolves();

                await request({
                    export: fakeExport,
                });
            });

            it('it responds with a 200', () => {
                expect(httpRes.status).to.have.been.calledWith(200);
            });

            it('it responds with a success = true', () => {
                expect(response.success).to.be.true;
            });
        });
    });
});
