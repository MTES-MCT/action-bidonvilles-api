module.exports = models => async (req, res) => {
    let response;
    try {
        response = await models.plan.create(Object.assign({}, req.filteredBody, {
            createdBy: req.user.id,
        }));
    } catch (error) {
        res.status(500);
        res.send({
            success: false,
            response: {
                userMessage: 'La création du dispositif a échoué',
            },
        });
        return;
    }

    res.status(200);
    res.send({
        success: true,
        response,
    });
};
