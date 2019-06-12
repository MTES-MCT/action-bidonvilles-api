module.exports = models => async (req, res) => {
    const { body } = req;
    const filteredBody = Object.assign({}, body);

    if (filteredBody.targetedOnTowns !== true) {
        filteredBody.towns = undefined;
    }

    const response = await models.plan.create(filteredBody);

    return res.status(200).send({
        success: true,
        response,
    });
    // const planData = Object.assign({}, req.body, {
    //     createdBy: req.user.id,
    //     updatedBy: req.user.id,
    // });
    // const plan = new Plan(planData);

    // const errors = await validate(plan);
    // if (Object.keys(errors).length > 0) {
    //     return res.status(500).send({
    //         error: {
    //             user_message: 'Les données saisies sont incomplètes ou incorrectes',
    //             fields: errors,
    //         },
    //     });
    // }

    // try {
    //     await models.plan.create(planData);
    // } catch (error) {
    //     return res.status(500).send({
    //         error: {
    //             user_message: 'Une erreur est survenue lors de l\'écriture des données en base',
    //             developer_message: error,
    //         },
    //     });
    // }

    // return res.status(200).send({});
};
