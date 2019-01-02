const parser = require('neat-csv');
const fs = require('fs');
const path = require('path');

module.exports = {
    up: queryInterface => parser(
        fs.readFileSync(path.join(__dirname, 'data', 'cities.csv'), { encoding: 'utf8' }),
        {
            headers: ['code', 'name', 'epciCode', 'epciName', 'departementCode', 'regionCode'],
            separator: ';',
        },
    )
        .then(cities => cities.filter(city => city.epciName !== 'Sans objet'))
        .then((cities) => {
            const epci = {};
            cities.forEach((city) => {
                epci[city.epciCode] = {
                    code: city.epciCode,
                    name: city.epciName,
                    fk_departement: city.departementCode,
                };
            });

            return queryInterface.bulkInsert('epci', Object.values(epci)).then(() => (cities));
        })
        .then(cities => queryInterface.bulkInsert(
            'cities',
            cities.map(city => ({
                code: city.code,
                name: city.name,
                fk_epci: city.epciCode,
            })),
        )),

    down: queryInterface => queryInterface.bulkDelete('cities')
        .then(() => queryInterface.bulkDelete('epci')),
};
