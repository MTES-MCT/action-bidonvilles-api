const parser = require('neat-csv');
const fs = require('fs');
const path = require('path');

module.exports = {
    up: queryInterface => parser(
        fs.readFileSync(path.join(__dirname, 'data', 'regions.csv'), { encoding: 'latin1' }),
        {
            headers: ['code', 'cheflieu', 'tncc', 'ncc', 'name'],
            separator: '\t',
        },
    )
        .then(data => queryInterface.bulkInsert(
            'regions',
            data.slice(1).map(region => ({
                code: region.code,
                name: region.name,
            })),
        )),

    down: queryInterface => queryInterface.bulkDelete('regions'),
};
