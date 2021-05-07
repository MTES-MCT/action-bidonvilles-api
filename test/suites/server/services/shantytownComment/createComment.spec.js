const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const { expect } = chai;
const { factory } = require('#server/services/shantytownComment/createComment');
const { serialized: fakeUser } = require('#test/utils/user');

const ServiceError = require('#server/errors/ServiceError');

describe.only('services/shantytownComment', () => {
    describe('createComment()', () => {
        describe('', () => {
            let input;
            let output;
            let dependencies;
            let response;
            beforeEach(async () => {
                // input data
                input = {
                    comment: { description: 'description', private: true },
                    shantytownId: 1,
                    user: fakeUser(),
                };

                // output data
                output = {
                    commentList: [],
                };

                // dependencies
                dependencies = {
                    createComment: sinon.stub(),
                    getComments: sinon.stub(),
                };

                // tested service
                const createComment = factory(dependencies);

                // getComments() retourne une liste de commentaires
                dependencies.getComments
                    .withArgs(input.user, [input.shantytownId], false)
                    .resolves({
                        [input.shantytownId]: output.commentList,
                    });

                response = await createComment(input.comment, input.shantytownId, input.user);
            });

            it('insère le commentaire en base de données via le modèle shantytownComment/create', () => {
                expect(dependencies.createComment).to.have.been.calledOnceWith({
                    description: 'description',
                    private: true,
                    fk_shantytown: 1,
                    created_by: 2,
                });
            });

            it('collecte et retourne la liste des commentaires actualisés', async () => {
                expect(response).to.be.eql(output.commentList);
            });
        });

        describe('si l\'insertion de commentaires échoue', () => {
            let createComment;
            const comment = { description: 'description', private: true };
            const user = fakeUser();
            const nativeError = new Error('une erreur');
            beforeEach(() => {
                const modelCreateComment = sinon.stub();
                modelCreateComment
                    .withArgs({
                        description: comment.description,
                        private: comment.private,
                        fk_shantytown: 1,
                        created_by: user.id,
                    })
                    .rejects(nativeError);

                createComment = factory({
                    createComment: modelCreateComment,
                    getComments: sinon.stub(),
                });
            });

            it('lance une exception de type ServiceError', async () => {
                let exception;
                try {
                    await createComment(comment, 1, user);
                } catch (error) {
                    exception = error;
                }

                expect(exception).to.be.instanceOf(ServiceError);
                expect(exception.code).to.be.eql('insert_failed');
                expect(exception.nativeError).to.be.eql(nativeError);
            });
        });

        describe('si le fetch de commentaires échoue', () => {
            let createComment;
            const comment = { description: 'description', private: true };
            const user = fakeUser();
            const nativeError = new Error('une erreur');
            beforeEach(() => {
                const modelGetComments = sinon.stub();
                modelGetComments
                    .withArgs(user, [1], false)
                    .rejects(nativeError);

                createComment = factory({
                    createComment: sinon.stub(),
                    getComments: modelGetComments,
                });
            });

            it('lance une exception de type ServiceError', async () => {
                let exception;
                try {
                    await createComment(comment, 1, user);
                } catch (error) {
                    exception = error;
                }

                expect(exception).to.be.instanceOf(ServiceError);
                expect(exception.code).to.be.eql('fetch_failed');
                expect(exception.nativeError).to.be.eql(nativeError);
            });
        });
    });
});
