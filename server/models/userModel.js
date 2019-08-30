const permissionsDescription = require('#server/permissions_description');

/**
 * @typedef {Object} UserFilters
 * @property {Boolean} [extended=false] Whether extended data should be returned or not
 * @property {Boolean} [auth=false]     Whether auth data should be returned or not
 *
 * Please find below the details about each filter:
 * - extended data is any data useful for the logged in user only. Typically, data that you
 *   would not need to display a user's profile page (example: default_export)
 * - auth data is any private authentication material: password, salt...
 */

/**
 * Merges organization's permissions into role's permissions
 *
 * @param {Permissions} rolePermissions
 * @param {Permissions} orgPermissions
 *
 * @returns {Permissions}
 */
function mergePermissions(rolePermissions, orgPermissions) {
    const permissions = Object.assign({}, rolePermissions);

    Object.keys(orgPermissions).forEach((entity) => {
        Object.assign(permissions[entity], orgPermissions[entity]);
    });

    return permissions;
}

/**
 * Gets the proper list of permissions for the given user
 *
 * @param {Object}        user
 * @param {PermissionMap} permissionMap
 *
 * @returns {Permissions}
 */
function getPermissionsFor(user, permissionMap) {
    if (user.is_admin === true) {
        return permissionMap.roles_admin[user.role] || {};
    }

    return mergePermissions(
        permissionMap.roles_regular[user.organization_type_role] || {},
        permissionMap.organizations[user.organization_id] || {},
    );
}

/**
 * Serializes a single user row
 *
 * @param {Object}             user
 * @param {UserFilters}        filters
 * @param {PermissionMap|Null} permissionMap Map should be null only if the filter "extended" is not TRUE
 *
 * @returns {Object}
 */
function serializeUser(user, filters, permissionMap) {
    const serialized = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        position: user.position,
        last_activation_link_sent_on: user.last_activation_link_sent_on ? user.last_activation_link_sent_on.getTime() / 1000 : null,
        active: user.active,
        activated_on: user.activated_on ? user.activated_on.getTime() / 1000 : null,
        created_at: user.created_at.getTime() / 1000,
        organization: {
            id: user.organization_id,
            name: user.organization_name,
            active: user.organization_active,
            type: {
                id: user.organization_type_id,
                name_singular: user.organization_type_name_singular,
                name_plural: user.organization_type_name_plural,
                abbreviation: user.organization_type_abbreviation,
            },
            category: {
                uid: user.organization_category_id,
                name_singular: user.organization_category_name_singular,
                name_plural: user.organization_category_name_plural,
            },
            location: {
                type: user.location_type,
                latitude: user.latitude || 46.7755829,
                longitude: user.longitude || 2.0497727,
                region: user.region_code !== null ? {
                    code: user.region_code,
                    name: user.region_name,
                } : null,
                departement: user.departement_code !== null ? {
                    code: user.departement_code,
                    name: user.departement_name,
                } : null,
                epci: user.epci_code !== null ? {
                    code: user.epci_code,
                    name: user.epci_name,
                } : null,
                city: user.city_code !== null ? {
                    code: user.city_code,
                    name: user.city_name,
                } : null,
            },
        },
        activated_by: {
            id: user.activator_id,
            first_name: user.activator_first_name,
            last_name: user.activator_last_name,
            position: user.activator_position,
            organization: {
                id: user.activator_organization_id,
                name: user.activator_organization_name,
            },
        },
        is_admin: user.is_admin,
        role: user.role_name || user.organization_type_role_name,
        role_id: user.role || user.organization_type_role,
    };

    if (filters.auth === true) {
        Object.assign(serialized, {
            password: user.password,
            salt: user.salt,
        });
    }

    if (filters.extended === true) {
        const roleDescription = permissionsDescription[serialized.role_id];
        const permissions = getPermissionsFor(user, permissionMap);

        Object.assign(serialized, {
            access_request_message: user.access_request_message,
            default_export: user.default_export ? user.default_export.split(',') : [],
            permissions,
            permission_options: roleDescription ? roleDescription.options.reduce((options, { id }) => {
                switch (id) {
                case 'close_shantytown':
                    if (permissions.shantytown && permissions.shantytown.close && permissions.shantytown.close.allowed) {
                        return [...options, id];
                    }
                    break;

                case 'create_and_close_shantytown':
                    if (permissions && permissions.shantytown && permissions.shantytown.close && permissions.shantytown.close.allowed) {
                        return [...options, id];
                    }
                    break;

                default:
                }

                return options;
            }, []) : [],
        });
    }

    return serialized;
}

module.exports = (database) => {
    // eslint-disable-next-line global-require
    const permissionModel = require('./permissionModel')(database);

    /**
     * Fetches a list of shantytowns from the database
     *
     * @param {Array.<Object>} where   List of where clauses
     * @param {UserFilters}    filters
     * @param {User}           [user]    The user's permissions are used for filtering the results of the query
     * @param {String}         [feature] Permissions to be checked (necessary only if a user is provided)
     *
     * @returns {Array.<Object>}
     */
    async function query(where = [], filters, user = null, feature) {
        const replacements = {};

        if (user !== null) {
            if (!user.permissions.user || !user.permissions.user[feature]) {
                return [];
            }

            const featureLevel = user.permissions.user[feature].geographic_level;
            const userLevel = user.organization.location.type;

            if (featureLevel !== 'nation' && (featureLevel !== 'local' || userLevel !== 'nation')) {
                if (user.organization.location.region === null) {
                    return [];
                }

                where.push({
                    location: {
                        query: 'organizations.region_code',
                        value: user.organization.location.region.code,
                    },
                });
            }
        }

        const whereClause = where.map((clauses, index) => {
            const clauseGroup = Object.keys(clauses).map((column) => {
                replacements[`${column}${index}`] = clauses[column].value || clauses[column];
                return `${clauses[column].query || `users.${column}`} IN (:${column}${index})`;
            }).join(' OR ');

            return `(${clauseGroup})`;
        }).join(' AND ');

        const users = await database.query(
            `SELECT
                users.user_id AS id,
                users.first_name,
                users.last_name,
                users.email,
                users.phone,
                users.position,
                users.password,
                users.salt,
                users.last_activation_link_sent_on,
                users.access_request_message,
                users.active,
                users.activated_on,
                users.default_export,
                users.created_at,
                CASE WHEN users.fk_role IS NULL THEN FALSE
                    ELSE TRUE
                END AS is_admin,
                users.fk_role AS role,
                roles_admin.name AS role_name,
                organizations.organization_id,
                organizations.name AS organization_name,
                organizations.location_type,
                organizations.active AS organization_active,
                organizations.region_code,
                organizations.region_name,
                organizations.departement_code,
                organizations.departement_name,
                organizations.epci_code,
                organizations.epci_name,
                organizations.city_code,
                organizations.city_name,
                organizations.latitude,
                organizations.longitude,
                organization_types.organization_type_id,
                organization_types.name_singular AS organization_type_name_singular,
                organization_types.name_plural AS organization_type_name_plural,
                organization_types.abbreviation AS organization_type_abbreviation,
                organization_types.fk_role AS organization_type_role,
                roles_regular.name AS organization_type_role_name,
                organization_categories.uid AS organization_category_id,
                organization_categories.name_singular AS organization_category_name_singular,
                organization_categories.name_plural AS organization_category_name_plural,
                activator.user_id AS activator_id,
                activator.first_name AS activator_first_name,
                activator.last_name AS activator_last_name,
                activator.position AS activator_position,
                activator_organization.organization_id AS activator_organization_id,
                activator_organization.name AS activator_organization_name
            FROM
                users
            LEFT JOIN
                roles_admin ON users.fk_role = roles_admin.role_id
            LEFT JOIN
                localized_organizations AS organizations ON users.fk_organization = organizations.organization_id
            LEFT JOIN
                organization_types ON organizations.fk_type = organization_types.organization_type_id
            LEFT JOIN
                organization_categories ON organization_types.fk_category = organization_categories.uid
            LEFT JOIN
                users AS activator ON users.created_by = activator.user_id
            LEFT JOIN
                organizations AS activator_organization ON activator.fk_organization = activator_organization.organization_id
            LEFT JOIN
                roles_regular ON organization_types.fk_role = roles_regular.role_id
            ${where.length > 0 ? `WHERE ${whereClause}` : ''}
            ORDER BY
                CASE WHEN users.activated_on IS NULL THEN 0 ELSE 1 END ASC,
                CASE WHEN users.last_activation_link_sent_on IS NULL THEN 0 ELSE 1 END ASC,
                CASE WHEN users.activated_on IS NULL THEN users.created_at ELSE NULL END DESC,
                upper(users.last_name) ASC,
                upper(users.first_name) ASC`,
            {
                type: database.QueryTypes.SELECT,
                replacements,
            },
        );

        if (users.length === 0) {
            return [];
        }

        let permissionMap = null;
        if (filters.extended === true) {
            const permissionOwners = users.reduce((acc, row) => {
                if (row.is_admin === true) {
                    if (!Object.prototype.hasOwnProperty.call(acc, 'role_admin')) {
                        acc.role_admin = [];
                    }

                    acc.role_admin.push(row.role);
                } else {
                    if (acc.organization.indexOf(row.organization_id) === -1) {
                        acc.organization.push(row.organization_id);
                    }

                    if (acc.role_regular.indexOf(row.organization_type_role) === -1) {
                        acc.role_regular.push(row.organization_type_role);
                    }
                }

                return acc;
            }, {
                organization: [],
                role_regular: [],
            });

            permissionMap = await permissionModel.find(permissionOwners);
        }

        return users.map(row => serializeUser(row, filters, permissionMap));
    }

    function getNationalAdmins() {
        return query([
            {
                fk_role: ['national_admin'],
            },
            {
                active: [true],
            },
            {
                organization_active: {
                    query: 'organizations.active',
                    value: [true],
                },
            },
        ], {});
    }

    function getLocalAdminsForRegion(regionCode) {
        return query([
            {
                fk_role: ['local_admin'],
            },
            {
                region: {
                    query: 'organizations.region_code',
                    value: [regionCode],
                },
            },
            {
                active: [true],
            },
            {
                organization_active: {
                    query: 'organizations.active',
                    value: [true],
                },
            },
        ], {});
    }

    const model = {
        /**
         * Returns ALL users
         *
         * @param {User} user Used for filtering the returned list based on permissions
         *
         * @returns {Array.<User>}
         */
        findAll: user => query([], { auth: false, extended: false }, user, 'list'),

        /**
         * Searches for a single user by user_id
         *
         * @param {Number}      userId
         * @param {UserFilters} [filters]
         * @param {User}        [user]    If the permissions should be checked
         * @param {String}      [feature='read']
         *
         * @returns {User}
         */
        findOne: async (userId, filters = {}, user = null, feature = 'read') => {
            const users = await query(
                [{ user_id: [userId] }],
                filters,
                user,
                feature,
            );

            return users.length === 1 ? users[0] : null;
        },

        /**
         * Searches for a single user by email
         *
         * @param {String}      email
         * @param {UserFilters} [filters]
         *
         * @returns {User}
         */
        findOneByEmail: async (email, filters = {}) => {
            const users = await query(
                [{ email: { value: [email.toUpperCase()], query: 'upper(users.email)' } }],
                filters,
            );

            return users.length === 1 ? users[0] : null;
        },

        create: async (user, transaction = undefined) => {
            const response = await database.query(
                `INSERT INTO
                    users(
                        first_name,
                        last_name,
                        email,
                        fk_organization,
                        position,
                        access_request_message,
                        salt,
                        phone,
                        active,
                        created_by
                    )

                    VALUES(
                        :first_name,
                        :last_name,
                        :email,
                        :organization,
                        :position,
                        :access_request_message,
                        :salt,
                        '',
                        FALSE,
                        :created_by
                    )
                    
                    RETURNING user_id`,
                {
                    replacements: user,
                    transaction,
                },
            );

            return response[0][0].user_id;
        },

        update: async (userId, values) => {
            if (userId === undefined) {
                throw new Error('The user id is missing');
            }

            const allowedProperties = [
                'first_name', 'last_name', 'position', 'phone', 'password', 'defaultExport', 'active', 'last_activation_link_sent_on',
                'activated_by', 'activated_on',
            ];
            const propertiesToColumns = {
                first_name: 'first_name',
                last_name: 'last_name',
                position: 'position',
                phone: 'phone',
                password: 'password',
                defaultExport: 'default_export',
                active: 'active',
                last_activation_link_sent_on: 'last_activation_link_sent_on',
                activated_by: 'activated_by',
                activated_on: 'activated_on',
            };
            const setClauses = [];
            const replacements = {};

            allowedProperties.forEach((property) => {
                if (values && values[property] !== undefined) {
                    setClauses.push(`${propertiesToColumns[property]} = :${property}`);

                    if (property === 'defaultExport' && values[property]) {
                        replacements[property] = values[property].replace(/\s/g, '') || null;
                    } else {
                        replacements[property] = values[property] || null;
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

        delete: id => database.query(
            'DELETE FROM users WHERE users.user_id = :id',
            {
                replacements: {
                    id,
                },
            },
        ),

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
    };

    model.getAdminsFor = async (user) => {
        if (user.organization.location.region === null) {
            return getNationalAdmins();
        }

        const localAdmins = await getLocalAdminsForRegion(user.organization.location.region.code);
        if (localAdmins.length === 0) {
            return getNationalAdmins();
        }

        return localAdmins;
    };

    return model;
};
