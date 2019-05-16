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
                    await sleep(10 * 1000);
                }

                try {
                    // eslint-disable-next-line
                    const response = await rp({
                        uri: `https://www.google.fr/maps/place/${departements[i].name}`,
                    });
                    const match = response.match(/APP_INITIALIZATION_STATE=\[\[\[[^,]+,([^,]+),([^,]+)\]/);
                    console.log({
                        name: departements[i].name,
                        latitude: match[2],
                        longitude: match[1],
                    });
                    if (parseFloat(match[2]) > 20 && parseFloat(match[1]) > 20) {
                        i -= 1;
                        console.log('Retrying...');
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
