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
        departement: user.departement,
        map_center: [user.latitude, user.longitude],
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
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
            replacements[`${column}${index}`] = clauses[column];
            return `${column} IN (:${column}${index})`;
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
                users.fk_departement AS departement,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS "roleId",
                users.default_export AS default_export,
                users.active AS active,
                users.salt AS salt,
                users.password AS password,
                departements.latitude AS latitude,
                departements.longitude AS longitude
            FROM users
            LEFT JOIN departements ON users.fk_departement = departements.code
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

module.exports = database => ({
    findAll: async () => query(database),

    findOne: async (userId, fullVersion = false) => {
        const users = await query(
            database,
            [{ user_id: [userId] }],
            fullVersion,
        );
        return users.length === 1 ? users[0] : null;
    },

    findOneByEmail: async (email, fullVersion = false) => {
        const users = await query(
            database,
            [{ email: [email] }],
            fullVersion,
        );
        return users.length === 1 ? users[0] : null;
    },

    create: async (user) => {
        const response = await database.query(
            `INSERT INTO
                users(
                    email,
                    password,
                    salt,
                    first_name,
                    last_name,
                    company,
                    fk_role,
                    fk_departement
                )

                VALUES(
                    :email,
                    :password,
                    :salt,
                    :firstName,
                    :lastName,
                    :company,
                    :role,
                    :departement
                )
                
                RETURNING user_id`,
            {
                replacements: user,
            },
        );

        return response[0][0].user_id;
    },

    update: async (userId, values) => {
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
    },

    deactivate: id => database.query(
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
    ),
});
