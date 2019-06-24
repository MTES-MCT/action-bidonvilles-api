module.exports = {

    up: queryInterface => queryInterface.sequelize.query(
        `CREATE OR REPLACE VIEW users_full AS
        (
            SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS fk_role,
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
        
                'nation' AS geo_level,
                users.fk_region,
                users.fk_departement,
                users.fk_epci,
                users.fk_city,
                46.7755829 AS latitude,
                2.0497727 AS longitude
            FROM
                users
            WHERE
                users.fk_region IS NULL
                AND
                users.fk_departement IS NULL
                AND
                users.fk_epci IS NULL
                AND
                users.fk_city IS NULL
        )
        UNION
        (
            SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS fk_role,
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
        
                'region' AS geo_level,
                users.fk_region,
                users.fk_departement,
                users.fk_epci,
                users.fk_city,
                46.7755829 AS latitude,
                2.0497727 AS longitude
            FROM
                users
            WHERE
                users.fk_region IS NOT NULL
        )
        UNION
        (
            SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS fk_role,
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
        
                'departement' AS geo_level,
                departements.fk_region,
                users.fk_departement,
                users.fk_epci,
                users.fk_city,
                departements.latitude,
                departements.longitude
            FROM
                users
            LEFT JOIN
                departements ON users.fk_departement = departements.code
            WHERE
                users.fk_departement IS NOT NULL
        )
        UNION
        (
            SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS fk_role,
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
        
                'epci' AS geo_level,
                departements.fk_region,
                departements.code,
                users.fk_epci,
                users.fk_city,
                departements.latitude,
                departements.longitude
            FROM
                users
            LEFT JOIN
                cities ON cities.code = (SELECT cities.code FROM cities WHERE cities.fk_epci = users.fk_epci LIMIT 1)
            LEFT JOIN
                departements ON cities.fk_departement = departements.code
            WHERE
                users.fk_epci IS NOT NULL
        )
        UNION
        (
            SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS fk_role,
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
        
                'city' AS geo_level,
                departements.fk_region,
                departements.code,
                users.fk_epci,
                users.fk_city,
                departements.latitude,
                departements.longitude
            FROM
                users
            LEFT JOIN
                cities ON cities.code = users.fk_city
            LEFT JOIN
                departements ON cities.fk_departement = departements.code
            WHERE
                users.fk_city IS NOT NULL
        )`,
    ),

    down: queryInterface => queryInterface.sequelize.query(
        'DROP VIEW users_full',
    ),

};
