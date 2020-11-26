const parser = require('neat-csv');
const fs = require('fs');
const path = require('path');

module.exports = {

    up: (queryInterface, Sequelize) => queryInterface.sequelize.transaction(
        transaction => queryInterface.createTable(
            'poi',
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    primaryKey: true,
                    autoIncrement: true,
                },
                solinum_id: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                created_at: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                updated_at: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                longitude: {
                    type: Sequelize.DOUBLE,
                    allowNull: false,
                },
                latitude: {
                    type: Sequelize.DOUBLE,
                    allowNull: false,
                },

                verified: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                categories: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                name: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                address: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                city: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                postal_code: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

                closed: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                },
                temporarily_closed: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                phone: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                email: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },

                temporary_information: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                temporary_hours:{
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                temporary_hour_start: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                temporary_hour_end: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                asile: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                refugie: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                family: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                age_min: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                age_max: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                sexe: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                animals: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                rdv_required: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                price:{
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                info: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                language: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
            },
            {
                transaction,
            },
        ).then(() => parser(
            fs.readFileSync(path.join(__dirname, '..', 'data', 'poi_26_11_2020.csv'), {encoding: 'utf8'})
        )).then((pois) => {
            const toBool = val => val === 'TRUE' ? true:false

            return queryInterface.bulkInsert(
                'poi',
                pois.map((poi) => {
                    return {
                        solinum_id: poi['Numéro'],

                        temporary_information: poi['Information temporaire'],
                        temporary_hours: poi['Horaire temporaire'],
                        temporary_hour_start: poi['Début Horaire temporaire'],
                        temporary_hour_end: poi['Fin Horaire temporaire'],
                        asile: toBool(poi['asile']),
                        refugie: toBool(poi['refugie']),
                        family: toBool(poi['family']),
                        age_min: poi['age_min'],
                        age_max: poi['age_max'],
                        sexe: poi['Sexe'],
                        animals: poi['animals'],
                        rdv_required: toBool(poi['sur_rdv']),
                        price: poi['price'],
                        info: poi['conditions_other'],
                        language: poi['Langues'],

                        created_at: null,
                        updated_at: null,
                        // Fix mistakes between Lat & Lng in the export
                        longitude: poi.Lat,
                        latitude: poi.Lng,
                        verified: toBool(poi['Vérifié']),
                        categories: poi['Catégories'],
                        name: poi['Nom de la structure'],
                        address: poi['Adresse'],
                        city: poi['Ville'],
                        postal_code: poi['Code Postal'],
                        closed: toBool(poi['Fermé']),
                        temporarily_closed: poi['Fermeture temporaire'],
                        phone: poi['Numéro de téléphone'],
                        email: poi['Email'],
                    };

                }),
                { transaction }
            );
        })
    ),
    down: queryInterface => queryInterface.dropTable('poi')


};

