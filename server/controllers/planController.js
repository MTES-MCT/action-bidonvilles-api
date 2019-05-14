const { Plan } = require('#db/models');

function convertNullError(error) {
    if (error.type !== 'notNull Violation') {
        return error;
    }

    const customMsg = error.instance.constructor.attributes[error.path].allowNullMsg;
    if (customMsg !== undefined) {
        // eslint-disable-next-line no-param-reassign
        error.message = customMsg;
    }

    return error;
}

function compileError(error) {
    return error.message;
}

async function validate(instance) {
    try {
        await instance.validate();
        return {};
    } catch (errors) {
        return errors.errors.reduce((acc, error) => {
            if (!acc[error.path]) {
                acc[error.path] = [];
            }

            acc[error.path].push(compileError(convertNullError(error)));
            return acc;
        }, {});
    }
}

module.exports = models => ({
    async list(req, res) {
        try {
            const filters = {};
            if (req.query.departement) {
                filters.fk_departement = [req.query.departement];
            }

            const plans = await models.plan.findAll(filters);
            res.status(200).send(plans);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },

    async find(req, res) {
        try {
            const plans = await models.plan.findOne(req.params.id);
            res.status(200).send(plans);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de la récupération des données en base',
                    developer_message: error.message,
                },
            });
        }
    },

    async create(req, res) {
        const planData = Object.assign({}, req.body, {
            createdBy: req.user.id,
        });
        const plan = new Plan(planData);

        const errors = await validate(plan);
        if (Object.keys(errors).length > 0) {
            return res.status(500).send({
                error: {
                    user_message: 'Les données saisies sont incomplètes ou incorrectes',
                    fields: errors,
                },
            });
        }

        try {
            await models.plan.create(planData);
        } catch (error) {
            return res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                    developer_message: error,
                },
            });
        }

        return res.status(200).send({});
    },

    async delete(req, res) {
        try {
            await models.plan.delete(req.params.id);
        } catch (error) {
            res.status(500).send({
                error: {
                    user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
                    developer_message: error,
                },
            });
        }

        return res.status(200).send({});
    },

});
