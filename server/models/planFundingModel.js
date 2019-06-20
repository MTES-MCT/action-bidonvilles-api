const { trim } = require('validator');

class CustomError extends Error {
    constructor(list) {
        super('Error');
        this.list = list;
    }
}

module.exports = database => ({
    validate: async (funding) => {
        if (!funding || Array.isArray(funding) || typeof funding !== 'object') {
            throw new CustomError(['Cette ligne de financement n\'est pas au bon format']);
        }

        const parsedFunding = Object.assign({}, funding);
        const errors = [];

        // check type
        let types;
        try {
            types = await database.query(
                'SELECT funding_type_id AS id, label FROM funding_types',
                {
                    type: database.QueryTypes.SELECT,
                },
            );
        } catch (error) {
            errors.push('Une erreur de lecture en base de données est survenue lors de la vérification du type de financement choisi');
        }

        if (types !== undefined) {
            const type = types.find(({ id }) => id === parseInt(funding.type, 10));
            if (type === undefined) {
                errors.push('Le type de financement choisi n\'existe pas en base de données');
            }

            parsedFunding.type = type;
        }

        // check amount
        if (typeof parsedFunding.amount !== 'number') {
            parsedFunding.amount = parseFloat(parsedFunding.amount);

            if (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(funding.amount) || Number.isNaN(parsedFunding.amount)) {
                errors.push('Le montant d\'un financement doit être un nombre');
            }
        }

        if (parsedFunding.amount < 0) {
            errors.push('Le montant d\'un financement ne peut pas être négatif');
        }

        // check details
        if (parsedFunding.details === null || parsedFunding.details === undefined) {
            parsedFunding.details = '';
        } else if (typeof parsedFunding.details !== 'string') {
            errors.push('Les précisions concernant ce financement ne sont pas au bon format');
        } else {
            parsedFunding.details = trim(parsedFunding.details);
        }

        if (errors.length > 0) {
            throw new CustomError(errors);
        }

        return parsedFunding;
    },
});
