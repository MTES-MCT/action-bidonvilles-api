const parser = require('neat-csv');
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { City } = require('../models');

module.exports = {
    up: queryInterface => parser(
        fs.readFileSync(path.join(__dirname, 'data', 'cities_with_districts.csv'), { encoding: 'latin1' }),
        {
            headers: [
                'ACTUAL',
                'CHEFLIEU',
                'CDC',
                'RANG',
                'REG',
                'DEP',
                'COM',
                'AR',
                'CT',
                'MODIF',
                'POLE',
                'TNCC',
                'ARTMAJ',
                'NCC',
                'ARTMIN',
                'NCCENR',
                'ARTICLCT',
                'NCCCT',
            ],
            separator: '	',
        },
    )
        .then(cities => cities.slice(1).filter(city => city.POLE !== ''))
        .then(async (cities) => {
            const mainCities = await City.findAll({
                where: {
                    code: {
                        [Sequelize.Op.or]: cities.map(city => city.POLE),
                    },
                },
            });

            const data = {};
            data.epcis = mainCities.reduce((obj, city) => {
                obj[city.code] = city.fk_epci;
                return obj;
            }, {});
            data.cities = cities.filter(city => data.epcis[city.POLE] !== undefined);

            return data;
        })
        .then(data => queryInterface.bulkInsert(
            'cities',
            data.cities.map(city => ({
                code: `${city.DEP}${city.COM}`,
                name: city.NCCENR,
                fk_epci: data.epcis[city.POLE],
                fk_main: city.POLE,
            })),
        )),

    down: queryInterface => queryInterface.bulkDelete('cities')
        .then(() => queryInterface.bulkDelete('epci')),
};
