const { validate } = require('#server/models/planFundingModel')(fakeDb);

describe.model('planFundingModel.validate()', () => {
    /** **********************************************************************************************
     * Fully valid case
     *********************************************************************************************** */

    const fundingType = {
        id: global.generate('number'),
        label: global.generate('string'),
    };

    const validInput = {
        type: `${fundingType.id}`,
        amount: global.generate('float'),
        details: global.generate('string'),
    };

    let input;
    let thrownError;
    prepare(() => {
        thrownError = undefined;
        input = Object.assign({}, validInput);

        fakeDb.query
            .resolves([])
            .withArgs(
                'SELECT funding_type_id AS id, label FROM funding_types',
                {
                    type: fakeDb.QueryTypes.SELECT,
                },
            )
            .resolves([fundingType]);
    });

    execute(async () => {
        try {
            returnedValue = await validate(input);
        } catch (error) {
            thrownError = error;
        }
    });

    describe('if the funding is valid', () => {
        it('should return the parsed funding', () => {
            expect(returnedValue).to.be.eql(Object.assign(input, {
                type: fundingType,
            }));
        });

        it('should return a different object that the passed argument', () => {
            expect(returnedValue).to.not.be.equal(validInput);
        });
    });


    /** **********************************************************************************************
     * Valid case variations
     *********************************************************************************************** */

    describe('if the amount is a string that can be parsed to a float', () => {
        prepare(() => {
            input.amount = '8.10';
        });
        it('returns the amount as a float', () => {
            expect(returnedValue.amount).to.be.eql(8.10);
        });
    });

    describe('if the details are missing (undefined or null)', () => {
        prepare(() => {
            input.details = global.generate(['null', 'undefined']);
        });
        it('returns an empty string in replacement', () => {
            expect(returnedValue.details).to.be.eql('');
        });
    });

    describe('if the details contain trailing spaces', () => {
        prepare(() => {
            input.details = `  ${validInput.details}   `;
        });
        it('trims the original details', () => {
            expect(returnedValue.details).to.be.eql(validInput.details);
        });
    });


    /** **********************************************************************************************
     * Error cases
     *********************************************************************************************** */

    describe('if the argument is not an object', () => {
        prepare(() => {
            input = global.generate().not('object');
        });
        it('should return a specific error message', () => {
            expect(thrownError.list).to.be.eql(
                ['Cette ligne de financement n\'est pas au bon format'],
            );
        });
    });

    // type
    describe('if the funding type does not match an existing type', () => {
        prepare(() => {
            input.type = global.generate('number');
        });
        it('should return a specific error message', () => {
            expect(thrownError.list).to.be.eql(
                ['Le type de financement choisi n\'existe pas en base de données'],
            );
        });
    });

    describe('if the request for funding types fails', () => {
        prepare(() => {
            fakeDb.query.reset();
            fakeDb.query.rejects(new Error(global.generate('string')));
        });
        it('should return a specific error message', () => {
            expect(thrownError.list).to.be.eql(
                ['Une erreur de lecture en base de données est survenue lors de la vérification du type de financement choisi'],
            );
        });
    });

    // amount
    [
        '2z4by8vuapfx9f6jihwk1d',
        global.generate().not(['number', 'float']),
    ].forEach((notANumber) => {
        describe(`if the amount is not a number (= ${notANumber})`, () => {
            prepare(() => {
                input.amount = notANumber;
            });
            it('should return a specific error message', () => {
                expect(thrownError.list).to.be.eql(
                    ['Le montant d\'un financement doit être un nombre'],
                );
            });
        });
    });

    describe('if the amount is negative', () => {
        prepare(() => {
            input.amount = '-8.10';
        });
        it('should return a specific error message', () => {
            expect(thrownError.list).to.be.eql(
                ['Le montant d\'un financement ne peut pas être négatif'],
            );
        });
    });

    // details
    describe('if the details are not a string', () => {
        prepare(() => {
            input.details = global.generate().not(['string', 'null', 'undefined']);
        });
        it('should return a specific error message', () => {
            expect(thrownError.list).to.be.eql(
                ['Les précisions concernant ce financement ne sont pas au bon format'],
            );
        });
    });

    // error mixes
    describe('if all props are invalid', () => {
        prepare(() => {
            input = {
                type: global.generate('number'),
                amount: -8.10,
                details: () => {},
            };
        });
        it('should return a specific error message for each prop', () => {
            expect(thrownError.list).to.be.eql([
                'Le type de financement choisi n\'existe pas en base de données',
                'Le montant d\'un financement ne peut pas être négatif',
                'Les précisions concernant ce financement ne sont pas au bon format',
            ]);
        });
    });
});
