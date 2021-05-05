module.exports = (req, res, next) => {
    if (req.body.comment.created_by !== req.user.id
        && !req.user.isAllowedTo('moderate', 'shantytown_comment')) {
        res.status(400).send({
            user_message: 'Vous n\'avez pas accès à ces données',
        });
        return;
    }

    next();
};
