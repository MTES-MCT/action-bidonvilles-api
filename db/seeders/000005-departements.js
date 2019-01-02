const parser = require('neat-csv');
const fs = require('fs');
const path = require('path');

module.exports = {
    up: queryInterface => Promise.all([
        parser(
            fs.readFileSync(path.join(__dirname, 'data', 'departements.csv'), { encoding: 'latin1' }),
            {
                headers: ['region', 'code', 'cheflieu', 'tncc', 'ncc', 'name'],
                separator: '\t',
            },
        ),
        parser(
            fs.readFileSync(path.join(__dirname, 'data', 'departement_centers.csv'), { encoding: 'utf8' }),
            {
                headers: ['departement', 'latitude', 'longitude'],
                separator: ';',
            },
        ),
    ])
        .then(([departements, centers]) => {
            const parsedCenters = {};
            centers.slice(1).forEach((center) => {
                parsedCenters[center.departement] = {
                    latitude: center.latitude,
                    longitude: center.longitude,
                };
            });

            return queryInterface.bulkInsert(
                'departements',
                departements.slice(1).map((departement) => {
                    const center = parsedCenters[departement.code];

                    return {
                        code: departement.code,
                        name: departement.name,
                        latitude: (center && center.latitude) || 0,
                        longitude: (center && center.longitude) || 0,
                        fk_region: departement.region,
                    };
                }),
            );
        }),

    down: queryInterface => queryInterface.bulkDelete('departements'),
};
