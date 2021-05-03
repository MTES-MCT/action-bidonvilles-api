const request = require('request-promise');

module.exports = () => ({
    async findAll(req, res, next) {
        const authKey = process.env.RB_API_SOLIGUIDE_KEY;

        try {
            if (!authKey) {
                return res.status(200).send([]);
            }

            // docs: https://solinum.gitbook.io/soliguide-api/detail-de-lapi/lieu-et-services
            const results = await request('https://api.soliguide.fr/search?limit=1000&categorie=601', {
                headers: {
                    Authorization: authKey,
                },
                json: true,
            });
            return res.status(200).send(results);
        } catch (error) {
            res.status(500).send({ user_message: 'Une erreur est survenue lors de la lecture en base de données' });
            return next(error);
        }
    },
});
