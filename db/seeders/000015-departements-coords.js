const rp = require('request-promise');

module.exports = {
    up: queryInterface => queryInterface.sequelize.query(
        'SELECT * FROM departements', {
            type: queryInterface.sequelize.QueryTypes.SELECT,
        },
    )
        .then(async (departements) => {
            const promises = [];
            for (let i = 0; i < departements.length; i += 1) {
                try {
                    // eslint-disable-next-line
                    const response = await rp({
                        uri: `https://www.google.fr/maps/place/${departements[i].name}`,
                    });
                    const match = response.match(/APP_INITIALIZATION_STATE=\[\[\[[^,]+,([^,]+),([^,]+)\]/);
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
