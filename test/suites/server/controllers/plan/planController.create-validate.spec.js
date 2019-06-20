const validate = require('#server/controllers/plan/planController.create-validate')(fakeModels);

describe.controller('planController.create-validate()', () => {
    const fakeFundingTypes = [
        {
            id: global.generate('number'),
            label: global.generate('string'),
        },
    ];
    const validBody = {
        name: global.generate('string'),
        type: global.generate('number'),
        startedAt: (new Date()).toString(),
        ngo: global.generate('number'),
        departement: global.generate('string'),
        targetedOnTowns: true,
        towns: [global.generate('number'), global.generate('number'), global.generate('number')],
        funding: [0, 1, 2].map(() => ({
            type: fakeFundingTypes[0].id,
            amount: global.generate('float'),
            details: global.generate('string'),
        })),
    };

    const fakeType = global.generate('object');
    const fakeNgo = global.generate('object');
    const fakeDepartement = global.generate('object');
    const fakeTowns = validBody.towns.map(id => ({
        id,
        departement: {
            code: validBody.departement,
            name: global.generate('string'),
        },
    }));
    const fakeFundings = validBody.funding.map(f => ({
        type: {
            id: f.type,
        },
        amount: f.amount,
        details: f.details,
    }));

    /** **********************************************************************************************
     * Fully valid case
     *********************************************************************************************** */

    prepare(() => {
        req.body = Object.assign({}, validBody);

        for (let i = 0; i < fakeFundings.length; i += 1) {
            fakeModels.planFunding.validate.onCall(i).resolves(fakeFundings[i]);
        }

        fakeModels.planType.findOneById
            .resolves(null)
            .withArgs(req.body.type).resolves(fakeType);

        fakeModels.ngo.findOneById
            .resolves(null)
            .withArgs(req.body.ngo).resolves(fakeNgo);

        fakeModels.departement.findOne
            .resolves(null)
            .withArgs(req.body.departement).resolves(fakeDepartement);

        fakeModels.shantytown.findAll
            .resolves(null)
            .withArgs([], { shantytown_id: req.body.towns }).resolves(fakeTowns);
    });

    execute(async () => {
        returnedValue = await validate(req, res, next);
    });

    describe('if the input is valid and does not need any filtering', () => {
        it('sets the filteredBody with parsed input', () => {
            expect(req.filteredBody).to.be.eql(Object.assign({}, validBody, {
                departement: fakeDepartement,
                funding: fakeFundings,
                ngo: fakeNgo,
                startedAt: new Date(validBody.startedAt),
                towns: fakeTowns,
                type: fakeType,
            }));
        });

        it('clones the body under `filteredBody` instead of using the original body reference', () => {
            expect(req.filteredBody).to.not.equal(req.body);
        });

        it('does not send a response', () => {
            expect(res.status).to.not.have.been.called;
            expect(res.send).to.not.have.been.called;
        });

        it('calls the next middleware', () => {
            expect(next).to.have.been.calledOnce;
        });

        it('returns the HTTP response instance', () => {
            expect(returnedValue).to.be.eql(res);
        });
    });

    /** **********************************************************************************************
     * Valid case variations
     *********************************************************************************************** */

    // name
    describe('if the name is undefined', () => {
        prepare(() => {
            req.body.name = undefined;
        });

        it('sets filteredBody.name to null', () => {
            expect(req.filteredBody.name).to.be.null;
        });
    });

    describe('if the name is null', () => {
        prepare(() => {
            req.body.name = null;
        });

        it('sets filteredBody.name to null', () => {
            expect(req.filteredBody.name).to.be.null;
        });
    });

    describe('if the name is an empty string', () => {
        prepare(() => {
            req.body.name = '';
        });

        it('sets filteredBody.name to null', () => {
            expect(req.filteredBody.name).to.be.null;
        });
    });

    describe('if the name contains trailing spaces', () => {
        const name = global.generate('string');
        prepare(() => {
            req.body.name = `   ${name}   `;
        });

        it('trims name before setting filteredBody.name', () => {
            expect(req.filteredBody.name).to.eql(name);
        });
    });

    // towns
    describe('if targetedOnTowns is set to false', () => {
        prepare(() => {
            req.body.targetedOnTowns = false;
        });

        it('filteredBody.towns is set to an empty array', () => {
            expect(req.filteredBody.towns).to.eql([]);
        });
    });

    /** **********************************************************************************************
     * Error cases
     *********************************************************************************************** */

    const describeError = (title, prepareCb, faultyInput, expectedError) => {
        describe(title, () => {
            prepare(prepareCb);

            it('does not call the next middleware', () => {
                expect(next).to.not.have.been.called;
            });

            it('returns the HTTP response instance', () => {
                expect(returnedValue).to.be.eql(res);
            });

            it('responds with a status 500', () => {
                expect(res.status).to.have.been.calledOnceWith(500);
            });

            it('responds with a success = false', () => {
                expect(sentData).to.containSubset({ success: false });
            });

            it('responds with a userMessage', () => {
                expect(sentData).to.containSubset({
                    response: {
                        userMessage: 'Certaines données sont manquantes ou invalides',
                    },
                });
            });

            it(`responds with an error message under fields.${faultyInput}`, () => {
                expect(sentData).to.containSubset({
                    response: {
                        fields: {
                            [faultyInput]: Array.isArray(expectedError) ? expectedError : [expectedError],
                        },
                    },
                });
            });
        });
    };

    // -- name --
    describeError(
        'if the name is not a string',
        () => { req.body.name = 0; },
        'name',
        'Le nom n\'est pas au bon format',
    );
    describeError(
        'if the name contains only blank characters',
        () => { req.body.name = '            '; },
        'name',
        'Le nom ne peut être composé uniquement d\'espaces',
    );

    // -- type --
    describeError(
        'if the type id does not match an existing plan_type',
        () => {
            fakeModels.planType.findOneById
                .withArgs(validBody.type).resolves(null);
        },
        'type',
        'Le type de dispositif sélectionné n\'existe pas en base de données',
    );

    describeError(
        'if fetching the type throws an error',
        () => {
            fakeModels.planType.findOneById
                .withArgs(validBody.type).rejects(global.generate('string'));
        },
        'type',
        'Une erreur de lecture en base de données est survenue',
    );

    // -- startedAt --
    describeError(
        'if startedAt is not a valid date string',
        () => {
            req.body.startedAt = global.generate('any');
        },
        'startedAt',
        'La date de début du dispositif n\'a pas été reconnue',
    );

    // -- ngo --
    describeError(
        'if the ngo id does not match an existing ngo',
        () => {
            fakeModels.ngo.findOneById
                .withArgs(validBody.ngo).resolves(null);
        },
        'ngo',
        'L\'opérateur sélectionné n\'existe pas en base de données',
    );

    describeError(
        'if fetching the ngo throws an error',
        () => {
            fakeModels.ngo.findOneById
                .withArgs(validBody.ngo).rejects(global.generate('string'));
        },
        'ngo',
        'Une erreur de lecture en base de données est survenue',
    );

    // -- departement --
    describeError(
        'if the departement code does not match an existing departement',
        () => {
            fakeModels.departement.findOne
                .withArgs(validBody.departement).resolves(null);
        },
        'departement',
        'Le département sélectionné n\'existe pas en base de données',
    );

    describeError(
        'if fetching the departement throws an error',
        () => {
            fakeModels.departement.findOne
                .withArgs(validBody.departement).rejects(global.generate('string'));
        },
        'departement',
        'Une erreur de lecture en base de données est survenue',
    );

    // -- targetedOnTowns --
    describeError(
        'if targetedOnTowns is not a boolean',
        () => {
            req.body.targetedOnTowns = global.generate().not('boolean');
        },
        'targetedOnTowns',
        'Indiquer si le dispositif est mené sur un ou plusieurs site(s) en particulier est obligatoire',
    );

    // -- towns --
    describeError(
        'if towns is not an array',
        () => {
            req.body.towns = global.generate().not('array');
        },
        'towns',
        'La liste des sites n\'est pas au bon format',
    );

    describeError(
        'if towns is empty',
        () => {
            req.body.towns = [];
        },
        'towns',
        'Vous devez sélectionner au moins un site parmi la liste',
    );

    describeError(
        'if towns contains town ids that do not match existing shantytowns',
        () => {
            fakeModels.shantytown.findAll
                .withArgs([], { shantytown_id: validBody.towns.slice(0) }).resolves([]);
        },
        'towns',
        'Un ou plusieurs sites sélectionnés n\'existent pas en base de données',
    );

    describeError(
        'if fetching towns throws an error',
        () => {
            fakeModels.shantytown.findAll
                .withArgs([], { shantytown_id: validBody.towns.slice(0) }).rejects(global.generate('string'));
        },
        'towns',
        'Une erreur de lecture en base de données est survenue',
    );

    describeError(
        'if towns references shantytowns from another departement than the one selected',
        () => {
            fakeModels.shantytown.findAll
                .withArgs([], { shantytown_id: validBody.towns.slice(0) }).resolves(
                    req.body.towns.map(id => ({
                        id,
                        departement: {
                            code: global.generate('string'),
                            name: global.generate('string'),
                        },
                    })),
                );
        },
        'towns',
        'Un ou plusieurs sites sélectionnés ne sont pas dans le bon département',
    );

    // -- funding --
    describeError(
        'if the list of fundings is not an array',
        () => {
            req.body.funding = global.generate().not('array');
        },
        'funding',
        'La liste des financements n\'est pas au bon format',
    );

    const randomErrors = [global.generate('string'), global.generate('string')];
    describeError(
        'if one funding contains errors',
        () => {
            fakeModels.planFunding.validate.onCall(1).rejects({
                list: randomErrors,
            });
        },
        'funding',
        [
            null,
            randomErrors,
            null,
        ],
    );
});
