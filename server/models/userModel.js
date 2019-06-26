/**
 * Serializes a single user row
 *
 * @param {Object}  permissionsByRole Map of permissions grouped by roles
 * @param {boolean} fullVersion       Whether the user's salt and password should be returned or not
 * @param {Object}  user
 *
 * @returns {Object}
 */
function serializeUser(permissionsByRole, fullVersion, user) {
    const serialized = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        organization: {
            id: user.organizationId,
            name: user.organizationName,
            type: {
                uid: user.organizationTypeUid,
                name: user.organizationTypeName,
                full_name: user.organizationTypeFullName,
            },
            geo_level: user.organizationGeoLevel,
            region: user.regionCode !== null ? {
                code: user.regionCode,
                name: user.regionName,
            } : null,
            departement: user.departementCode !== null ? {
                code: user.departementCode,
                name: user.departementName,
            } : null,
            epci: user.epciCode !== null ? {
                code: user.epciCode,
                name: user.epciName,
            } : null,
            city: user.cityCode !== null ? {
                code: user.cityCode,
                name: user.cityName,
            } : null,
        },
        map_center: [user.latitude, user.longitude],
        permissions: permissionsByRole[user.roleId] || {
            feature: [],
            data: [],
        },
        default_export: user.default_export ? user.default_export.split(',') : [],
        active: user.active === true,
    };

    if (fullVersion === true) {
        serialized.salt = user.salt;
        serialized.password = user.password;
    }

    return serialized;
}

/**
 * Fetches a list of shantytowns from the database
 *
 * @param {Sequelize}      database
 * @param {Array.<Object>} where       List of where clauses
 * @param {boolean}        fullVersion Whether the user's salt and password should be returned or not
 *
 * @returns {Array.<Object>}
 */
async function query(database, where = [], fullVersion) {
    const replacements = {};
    const whereClause = where.map((clauses, index) => {
        const clauseGroup = Object.keys(clauses).map((column) => {
            replacements[`${column}${index}`] = clauses[column].value || clauses[column];
            return `${clauses[column].query || column} IN (:${column}${index})`;
        }).join(' OR ');

        return `(${clauseGroup})`;
    }).join(' AND ');

    const [permissions, users] = await Promise.all([
        database.query(
            `SELECT
                role_permissions.fk_role AS "roleId",
                permissions.type AS type,
                permissions.name AS name
            FROM role_permissions
            LEFT JOIN permissions ON role_permissions.fk_permission = permissions.permission_id`,
            {
                type: database.QueryTypes.SELECT,
            },
        ),
        database.query(
            `SELECT
                users.user_id AS id,
                users.email AS email,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.fk_role AS "roleId",
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password
                organizations.latitude AS latitude,
                organizations.longitude AS longitude,
                organizations.organization_id AS "organizationId",
                organizations.name AS "organizationName",
                organizations.geo_level AS "organizationGeoLevel",
                organization_types.uid AS "organizationTypeUid",
                organization_types.name AS "organizationTypeName",
                organization_types.full_name AS "organizationTypeFullName",
                organizations.regionCode AS "regionCode",
                organizations.regionName AS "regionName",
                organizations.departementCode AS "departementCode",
                organizations.departementName AS "departementName",
                organizations.epciCode AS "epciCode",
                organizations.epciName AS "epciName",
                organizations.cityCode AS "cityCode",
                organizations.cityName AS "cityName"
            FROM users
                LEFT JOIN organizations_full AS organizations ON users.fk_organization = organizations.organization_id
                LEFT JOIN organization_types ON organizations.fk_organization_type = organization_types.uid
            ${where.length > 0 ? `WHERE ${whereClause}` : ''}
            ORDER BY id ASC`,
            {
                type: database.QueryTypes.SELECT,
                replacements,
            },
        ),
    ]);

    if (users.length === 0) {
        return [];
    }

    const permissionsGroupedByRole = permissions.reduce((acc, row) => {
        let newAcc = acc;
        if (!acc[row.roleId]) {
            newAcc = Object.assign(acc, {
                [row.roleId]: {
                    feature: [],
                    data: [],
                },
            });
        }

        newAcc[row.roleId][row.type].push(row.name);
        return newAcc;
    }, {});

    return users.map(serializeUser.bind(this, permissionsGroupedByRole, fullVersion));
}

module.exports = (database) => {
    const methods = {};

    methods.findAll = async () => query(database);

    methods.findOne = async (userId, fullVersion = false) => {
        const users = await query(
            database,
            [{ user_id: [userId] }],
            fullVersion,
        );
        return users.length === 1 ? users[0] : null;
    };

    methods.findOneByEmail = async (email, fullVersion = false) => {
        const users = await query(
            database,
            [{ email: { value: [email.toUpperCase()], query: 'upper(email)' } }],
            fullVersion,
        );
        return users.length === 1 ? users[0] : null;
    };

    methods.create = async (user) => {
        const response = await database.query(
            `INSERT INTO
                users(
                    email,
                    password,
                    salt,
                    first_name,
                    last_name,
                    fk_role,
                    fk_organization
                )

                VALUES(
                    :email,
                    :password,
                    :salt,
                    :firstName,
                    :lastName,
                    :role,
                    :organization
                )
                
                RETURNING user_id`,
            {
                replacements: user,
            },
        );

        return methods.findOne(response[0][0].user_id);
    };

    methods.update = async (userId, values) => {
        if (userId === undefined) {
            throw new Error('The user id is missing');
        }

        const allowedProperties = ['password', 'defaultExport', 'active'];
        const propertiesToColumns = {
            password: 'password',
            defaultExport: 'default_export',
            active: 'active',
        };
        const setClauses = [];
        const replacements = {};

        allowedProperties.forEach((property) => {
            if (values && values[property] !== undefined) {
                setClauses.push(`${propertiesToColumns[property]} = :${property}`);

                if (property === 'defaultExport' && values[property]) {
                    replacements[property] = values[property].replace(/\s/g, '') || null;
                } else {
                    replacements[property] = values[property];
                }
            }
        });

        if (setClauses.length === 0) {
            throw new Error('The updated values are missing');
        }

        const [, { rowCount }] = await database.query(
            `UPDATE
                users
            SET
                ${setClauses.join(',')}
            WHERE
                users.user_id = :userId`,
            {
                replacements: Object.assign(replacements, {
                    userId,
                }),
            },
        );

        if (rowCount === 0) {
            throw new Error(`The user #${userId} does not exist`);
        }

        return methods.findOne(userId);
    };

    methods.deactivate = id => database.query(
        `UPDATE
            users
        SET
            active = FALSE,
            password = NULL
        WHERE
            user_id = :id
        `,
        {
            replacements: {
                id,
            },
        },
    );

    return methods;
};
