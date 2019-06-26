module.exports = {

    up: queryInterface => queryInterface.sequelize.query(
        `CREATE OR REPLACE VIEW organizations_full AS
        (
            SELECT
                organizations.organization_id AS organization_id,
                organizations.name AS name,
                organizations.fk_organization_type AS fk_organization_type,
                organizations.created_at AS created_at,
                organizations.created_by AS created_by,
                organizations.updated_at AS updated_at,
                organizations.updated_by AS updated_by,
        
                'nation' AS geo_level,
                NULL AS "regionCode",
                NULL AS "regionName",
                NULL AS "departementCode",
                NULL AS "departementName",
                NULL AS "epciCode",
                NULL AS "epciName",
                NULL AS "cityCode",
                NULL AS "cityName",

                46.7755829 AS "latitude",
                2.0497727 AS "longitude"
            FROM
                organizations
            WHERE
                organizations.fk_region IS NULL
                AND
                organizations.fk_departement IS NULL
                AND
                organizations.fk_epci IS NULL
                AND
                organizations.fk_city IS NULL
        )
        UNION
        (
            SELECT
                organizations.organization_id AS organization_id,
                organizations.name AS name,
                organizations.fk_organization_type AS fk_organization_type,
                organizations.created_at AS created_at,
                organizations.created_by AS created_by,
                organizations.updated_at AS updated_at,
                organizations.updated_by AS updated_by,
        
                'region' AS geo_level,
                regions.code AS "regionCode",
                regions.name AS "regionName",
                NULL AS "departementCode",
                NULL AS "departementName",
                NULL AS "epciCode",
                NULL AS "epciName",
                NULL AS "cityCode",
                NULL AS "cityName",

                46.7755829 AS "latitude",
                2.0497727 AS "longitude"
            FROM
                organizations
            LEFT JOIN
                regions ON organizations.fk_region = regions.code
            WHERE
                organizations.fk_region IS NOT NULL
        )
        UNION
        (
            SELECT
                organizations.organization_id AS organization_id,
                organizations.name AS name,
                organizations.fk_organization_type AS fk_organization_type,
                organizations.created_at AS created_at,
                organizations.created_by AS created_by,
                organizations.updated_at AS updated_at,
                organizations.updated_by AS updated_by,
        
                'departement' AS geo_level,
                regions.code AS "regionCode",
                regions.name AS "regionName",
                departements.code AS "departementCode",
                departements.name AS "departementName",
                NULL AS "epciCode",
                NULL AS "epciName",
                NULL AS "cityCode",
                NULL AS "cityName",

                departements.latitude AS "latitude",
                departements.longitude AS "longitude"
            FROM
                organizations
            LEFT JOIN
                departements ON organizations.fk_departement = departements.code
            LEFT JOIN
                regions ON departements.fk_region = regions.code
            WHERE
                organizations.fk_departement IS NOT NULL
        )
        UNION
        (
            SELECT
                organizations.organization_id AS organization_id,
                organizations.name AS name,
                organizations.fk_organization_type AS fk_organization_type,
                organizations.created_at AS created_at,
                organizations.created_by AS created_by,
                organizations.updated_at AS updated_at,
                organizations.updated_by AS updated_by,
        
                'epci' AS geo_level,
                regions.code AS "regionCode",
                regions.name AS "regionName",
                departements.code AS "departementCode",
                departements.name AS "departementName",
                epci.code AS "epciCode",
                epci.name AS "epciName",
                NULL AS "cityCode",
                NULL AS "cityName",

                departements.latitude AS "latitude",
                departements.longitude AS "longitude"
            FROM
                organizations
            LEFT JOIN
                cities ON cities.code = (SELECT cities.code FROM cities WHERE cities.fk_epci = organizations.fk_epci LIMIT 1)
            LEFT JOIN
                departements ON cities.fk_departement = departements.code
            LEFT JOIN
                epci ON cities.fk_epci = epci.code
            LEFT JOIN
                regions ON departements.fk_region = regions.code
            WHERE
                organizations.fk_epci IS NOT NULL
        )
        UNION
        (
            SELECT
                organizations.organization_id AS organization_id,
                organizations.name AS name,
                organizations.fk_organization_type AS fk_organization_type,
                organizations.created_at AS created_at,
                organizations.created_by AS created_by,
                organizations.updated_at AS updated_at,
                organizations.updated_by AS updated_by,
        
                'city' AS geo_level,
                regions.code AS "regionCode",
                regions.name AS "regionName",
                departements.code AS "departementCode",
                departements.name AS "departementName",
                epci.code AS "epciCode",
                epci.name AS "epciName",
                cities.code AS "cityCode",
                cities.name AS "cityName",

                departements.latitude AS "latitude",
                departements.longitude AS "longitude"
            FROM
                organizations
            LEFT JOIN
                cities ON cities.code = organizations.fk_city
            LEFT JOIN
                departements ON cities.fk_departement = departements.code
            LEFT JOIN
                epci ON cities.fk_epci = epci.code
            LEFT JOIN
                regions ON departements.fk_region = regions.code
            WHERE
                organizations.fk_city IS NOT NULL
        )`,
    ),

    down: queryInterface => queryInterface.sequelize.query(
        'DROP VIEW organizations_full',
    ),

};
