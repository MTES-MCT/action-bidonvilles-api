const { trim } = require('validator');

class CustomError extends Error {
    constructor(list) {
        super('Error');
        this.list = Array.isArray(list) ? list : [list];
    }
}

module.exports = models => async (req, res, next) => {
    const validators = {
        // the name is optional (but if provided, it must be trimmed and not contain only blank characters)
        name: (value) => {
            if (value === undefined || value === null || value === '') {
                return null;
            }

            if (typeof value !== 'string') {
                throw new CustomError('Le nom n\'est pas au bon format');
            }

            const name = trim(value);
            if (name === '') {
                throw new CustomError('Le nom ne peut être composé uniquement d\'espaces');
            }

            return name;
        },

        // the type is mandatory and must match an existing planType
        type: async (value) => {
            let type;
            try {
                type = await models.planType.findOneById(value);
            } catch (error) {
                throw new CustomError('Une erreur de lecture en base de données est survenue');
            }

            if (type === null) {
                throw new CustomError('Le type de dispositif sélectionné n\'existe pas en base de données');
            }

            return type;
        },

        // the start date is mandatory
        startedAt: (value) => {
            if (typeof value !== 'string') {
                throw new CustomError('La date de début du dispositif n\'a pas été reconnue');
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                throw new CustomError('La date de début du dispositif n\'a pas été reconnue');
            }

            return date;
        },

        // the  ngo is mandatory and  must match an existing ngo
        ngo: async (value) => {
            let ngo;
            try {
                ngo = await models.ngo.findOneById(value);
            } catch (error) {
                throw new CustomError('Une erreur de lecture en base de données est survenue');
            }

            if (ngo === null) {
                throw new CustomError('L\'opérateur sélectionné n\'existe pas en base de données');
            }

            return ngo;
        },

        // the departement is mandatory and must match an existing departement
        departement: async (value) => {
            let departement;
            try {
                departement = await models.departement.findOne(value);
            } catch (error) {
                throw new CustomError('Une erreur de lecture en base de données est survenue');
            }

            if (departement === null) {
                throw new CustomError('Le département sélectionné n\'existe pas en base de données');
            }

            return departement;
        },

        // untouched
        targetedOnTowns: (value) => {
            if (typeof value !== 'boolean') {
                throw new CustomError('Indiquer si le dispositif est mené sur un ou plusieurs site(s) en particulier est obligatoire');
            }

            return value;
        },

        // towns are optionals but they must reference existing towns and be located in the same departement
        towns: async (value, { targetedOnTowns, departement }) => {
            if (targetedOnTowns !== true) {
                return [];
            }

            if (!Array.isArray(value)) {
                throw new CustomError('La liste des sites n\'est pas au bon format');
            }

            if (value.length === 0) {
                throw new CustomError('Vous devez sélectionner au moins un site parmi la liste');
            }

            let towns;
            try {
                towns = await models.shantytown.findAll([], {
                    shantytown_id: value,
                });
            } catch (error) {
                throw new CustomError('Une erreur de lecture en base de données est survenue');
            }

            if (towns.length !== value.length) {
                throw new CustomError('Un ou plusieurs sites sélectionnés n\'existent pas en base de données');
            }

            if (towns.some(({ departement: { code } }) => code !== departement)) {
                throw new CustomError('Un ou plusieurs sites sélectionnés ne sont pas dans le bon département');
            }

            return towns;
        },

        //
        funding: async (value) => {
            if (!Array.isArray(value)) {
                throw new CustomError('La liste des financements n\'est pas au bon format');
            }

            const parsed = [];
            const errors = [];
            let errored = false;
            for (let i = 0; i < value.length; i += 1) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    parsed.push(await models.planFunding.validate(value[i]));
                    errors.push(null);
                } catch (error) {
                    errored = true;
                    errors.push(error.list);
                }
            }

            if (errored) {
                throw new CustomError(errors);
            }

            return parsed;
        },
    };

    // validate each input
    const inputs = Object.keys(validators);
    const errors = {};
    const filteredBody = {};

    for (let i = 0; i < inputs.length; i += 1) {
        const inputName = inputs[i];

        try {
            // eslint-disable-next-line no-await-in-loop
            filteredBody[inputName] = await validators[inputName](req.body[inputName], req.body);
        } catch (error) {
            errors[inputName] = error.list;
        }
    }

    // check if there is any error
    if (Object.keys(errors).length > 0) {
        res.status(500);
        res.send({
            success: false,
            response: {
                userMessage: 'Certaines données sont manquantes ou invalides',
                fields: errors,
            },
        });
    } else {
        req.filteredBody = filteredBody;
        next();
    }

    return res;
};
