/**
 * Serializes a single user row
 *
 * @param {Object} user
 *
 * @returns {Object}
 */
function serializeUser(user) {
    return {
        id: user.id,
        email: user.email,
        departement: user.departement,
        map_center: [user.latitude, user.longitude],
        first_name: user.first_name,
        last_name: user.last_name,
        company: user.company,
        permissions: {
            feature: [],
            data: [],
        },
        default_export: user.default_export ? user.default_export.split(',') : [],
    };
}

module.exports = database => ({
    findOne: async (userId) => {
        const users = await database.query(
            `SELECT
                users.user_id AS id,
                users.email AS email,
                users.fk_departement AS departement,
                users.first_name AS first_name,
                users.last_name AS last_name,
                users.company AS company,
                users.fk_role AS "roleId",
                users.default_export AS default_export,
                departements.latitude AS latitude,
                departements.longitude AS longitude
            FROM users
            LEFT JOIN departements ON users.fk_departement = departements.code
            WHERE users.user_id = :id`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    id: userId,
                },
            },
        );

        if (users.length === 0) {
            return null;
        }

        const user = serializeUser(users[0]);
        const permissions = await database.query(
            `SELECT
                permissions.type AS type,
                permissions.name AS name
            FROM role_permissions
            LEFT JOIN permissions ON role_permissions.fk_permission = permissions.permission_id
            WHERE role_permissions.fk_role = :roleId`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    roleId: users[0].roleId,
                },
            },
        );

        permissions.forEach((permission) => {
            user.permissions[permission.type].push(permission.name);
        });

        return user;
    },

    setDefaultExport: async (userId, newDefaultExport) => {
        if (userId === undefined) {
            throw new Error('The user id is missing');
        }

        if (newDefaultExport === undefined) {
            throw new Error('The new default-export value is missing');
        }

        const [, { rowCount }] = await database.query(
            `UPDATE
                users
            SET
                default_export = :defaultExport
            WHERE
                users.user_id = :userId`,
            {
                replacements: {
                    defaultExport: newDefaultExport ? newDefaultExport.replace(/\s/g, '') : newDefaultExport,
                    userId,
                },
            },
        );

        if (rowCount === 0) {
            throw new Error(`The user #${userId} does not exist`);
        }
    },
});
