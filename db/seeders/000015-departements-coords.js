const rp = require('request-promise');

async function sleep(delay) {
    return new Promise((success) => {
        setTimeout(success, delay);
    });
}

module.exports = {
    up: queryInterface => queryInterface.sequelize.query(
        'SELECT * FROM departements', {
            type: queryInterface.sequelize.QueryTypes.SELECT,
        },
    )
        .then(async (departements) => {
            const promises = [];
            for (let i = 0; i < departements.length; i += 1) {
                if (i > 0) {
                    // eslint-disable-next-line
                    await sleep(2 * 1000);
                }

                try {
                    // eslint-disable-next-line
                    const response = await rp({
                        uri: `https://www.google.fr/maps/place/${encodeURI(departements[i].name)}/`,
                        headers: {
                            'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
                        },
                    });
                    const match = response.match(/APP_INITIALIZATION_STATE=\[\[\[[^,]+,([^,]+),([^,]+)\]/);
                    if (parseFloat(match[2]) > 20 && parseFloat(match[1]) > 20) {
                        console.log(`Failed for: ${departements[i].name}`);
                    } else {
                        promises.push(queryInterface.sequelize.query(
                            'UPDATE departements SET latitude = :latitude, longitude = :longitude WHERE name = :name',
                            {
                                replacements: {
                                    name: departements[i].name,
                                    latitude: match[2],
                                    longitude: match[1],
                                },
                            },
                        ));
                    }
                } catch (ignore) {
                    console.log(ignore);
                    console.log(`Failed for: ${departements[i].name}`);
                }
            }

            return promises;
        }),

    down: () => {

    },
};
