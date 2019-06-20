const create = require('#server/controllers/plan/planController.create')(fakeModels);

describe.controller('planController.create()', () => {
    const fakeId = global.generate('number');
    const fakeUser = {
        id: global.generate('number'),
    };
    let mergedInput;

    prepare(() => {
        req.filteredBody = {};
        req.user = fakeUser;

        mergedInput = Object.assign({}, req.filteredBody, { createdBy: fakeUser.id });

        fakeModels.plan.create
            .rejects(new Error(''))
            .withArgs(mergedInput).resolves(fakeId);
    });

    execute(async () => {
        await create(req, res, next);
    });

    describe('if the query succeeds', () => {
        it('should send a status = 200', () => {
            expect(res.status).to.have.been.calledOnceWith(200);
        });

        it('should respond with a success = true', () => {
            expect(sentData).to.containSubset({ success: true });
        });

        it('should respond with the id of the newly created plan', () => {
            expect(sentData).to.containSubset({
                response: fakeId,
            });
        });
    });

    describe('if the query fails', () => {
        prepare(() => {
            fakeModels.plan.create.reset();
            fakeModels.plan.create.rejects(new Error(''));
        });

        it('should send a status = 500', () => {
            expect(res.status).to.have.been.calledOnceWith(500);
        });

        it('should respond with a success = false', () => {
            expect(sentData).to.containSubset({ success: false });
        });

        it('should respond with the proper error message', () => {
            expect(sentData).to.containSubset({
                response: {
                    userMessage: 'La création du dispositif a échoué',
                },
            });
        });
    });
});
