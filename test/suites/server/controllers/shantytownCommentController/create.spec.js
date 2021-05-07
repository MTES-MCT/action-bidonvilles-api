const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { mockReq, mockRes } = require('sinon-express-mock');
const { serialized: fakeUser } = require('#test/utils/user');

const { expect } = chai;
chai.use(sinonChai);

const { factory } = require('#server/controllers/shantytownCommentController/create');
const ServiceError = require('#server/errors/ServiceError');

describe.only('shantytownCommentController.create()', () => {
    it('fait appel au service shantytownComment/createComment() pour insérer le commentaire', async () => {
        const srvCreateComment = sinon.stub();
        const user = fakeUser();
        const ctlCreate = factory({ createComment: srvCreateComment });

        await ctlCreate(
            mockReq({
                body: {
                    description: 'description',
                    private: true,
                    shantytown: { id: 1 },
                },
                user,
            }),
            mockRes(),
            sinon.stub(),
        );

        expect(srvCreateComment).to.have.been.calledOnceWith(
            { description: 'description', private: true },
            1,
            user,
        );
    });

    it('répond une 200 et la liste des commentaires retournée par le service shantytownComment/createComment()', async () => {
        // le service createComment() retourne une liste de commentaires
        const comments = [];
        const srvCreateComment = sinon.stub();
        srvCreateComment.resolves(comments);

        const ctlCreate = factory({ createComment: srvCreateComment });

        const res = mockRes();
        await ctlCreate(
            mockReq({
                body: {
                    description: 'description',
                    private: true,
                    shantytown: { id: 1 },
                },
                user: fakeUser(),
            }),
            res,
            sinon.stub(),
        );

        expect(res.status).to.have.been.calledOnceWith(200);
        expect(res.send).to.have.been.calledOnceWith({
            comments,
        });
    });

    describe('si le service échoue à insérer le commentaire', () => {
        let res;
        let next;
        let error;
        beforeEach(async () => {
            const srvCreateComment = sinon.stub();
            error = new Error('Une erreur');
            srvCreateComment.rejects(new ServiceError('insert_failed', error));

            const ctlCreate = factory({ createComment: srvCreateComment });
            res = mockRes();
            next = sinon.stub();

            await ctlCreate(
                mockReq({
                    body: { description: '', private: true, shantytown: { id: 1 } },
                    user: fakeUser(),
                }),
                res,
                next,
            );
        });

        it('répond une 500', () => {
            expect(res.status).to.have.been.calledOnceWith(500);
        });

        it('répond un message d\'erreur spécifique', () => {
            expect(res.send).to.have.been.calledOnceWith({
                user_message: 'Votre commentaire n\'a pas pu être enregistré.',
            });
        });

        it('passe l\'erreur native à next() pour enregistrement auprès de Sentry', () => {
            expect(next).to.have.been.calledOnceWith(error);
        });
    });

    describe('si le service échoue à fetch la liste des commentaires', () => {
        let res;
        let next;
        let error;
        beforeEach(async () => {
            const srvCreateComment = sinon.stub();
            error = new Error('Une erreur');
            srvCreateComment.rejects(new ServiceError('fetch_failed', error));

            const ctlCreate = factory({ createComment: srvCreateComment });
            res = mockRes();
            next = sinon.stub();

            await ctlCreate(
                mockReq({
                    body: { description: '', private: true, shantytown: { id: 1 } },
                    user: fakeUser(),
                }),
                res,
                next,
            );
        });

        it('répond une 500', () => {
            expect(res.status).to.have.been.calledOnceWith(500);
        });

        it('répond un message d\'erreur spécifique', () => {
            expect(res.send).to.have.been.calledOnceWith({
                user_message: 'Votre commentaire a bien été enregistré mais la liste des commentaires n\'a pas pu être actualisée.',
            });
        });

        it('passe l\'erreur native à next() pour enregistrement auprès de Sentry', () => {
            expect(next).to.have.been.calledOnceWith(error);
        });
    });

    describe('si le service échoue pour une raison inconnue', () => {
        let res;
        let next;
        let error;
        beforeEach(async () => {
            const srvCreateComment = sinon.stub();
            error = new Error('Une erreur');
            srvCreateComment.rejects(error);

            const ctlCreate = factory({ createComment: srvCreateComment });
            res = mockRes();
            next = sinon.stub();

            await ctlCreate(
                mockReq({
                    body: { description: '', private: true, shantytown: { id: 1 } },
                    user: fakeUser(),
                }),
                res,
                next,
            );
        });

        it('répond une 500', () => {
            expect(res.status).to.have.been.calledOnceWith(500);
        });

        it('répond un message d\'erreur spécifique', () => {
            expect(res.send).to.have.been.calledOnceWith({
                user_message: 'Une erreur inconnue est survenue.',
            });
        });

        it('passe l\'erreur native à next() pour enregistrement auprès de Sentry', () => {
            expect(next).to.have.been.calledOnceWith(error);
        });
    });
});
