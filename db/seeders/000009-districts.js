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

            const data = {
                departements: {},
                epci: {},
            };
            mainCities.forEach((city) => {
                data.departements[city.code] = city.fk_departement;
                data.epci[city.code] = city.fk_epci;
            });
            data.cities = cities.filter(city => data.departements[city.POLE] !== undefined);

            return data;
        })
        .then(data => queryInterface.bulkInsert(
            'cities',
            data.cities.map(city => ({
                code: `${city.DEP}${city.COM}`,
                name: city.NCCENR,
                fk_epci: data.epci[city.POLE],
                fk_departement: data.departements[city.POLE],
                fk_main: city.POLE,
            })),
        )),

    down: queryInterface => queryInterface.bulkDelete('cities')
        .then(() => queryInterface.bulkDelete('epci')),
};
