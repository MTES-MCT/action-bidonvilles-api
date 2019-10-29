const { fromTsToFormat } = require('#server/utils/date');

/**
 * Converts a date column to a timestamp
 *
 * Always uses midnight as the time value.
 *
 * @param {string|null} date The date, as stored in the column
 *
 * @returns {number|null}
 */
function fromDateToTimestamp(date) {
    return date !== null ? (new Date(`${date}T00:00:00`).getTime() / 1000) : null;
}

function fromGeoLevelToTableName(geoLevel) {
    switch (geoLevel) {
    case 'region':
        return 'regions';

    case 'departement':
        return 'departements';

    case 'epci':
        return 'epci';

    case 'city':
        return 'cities';

    default:
        return null;
    }
}

/**
 * Returns a changelog diff between two version of a same shantytown
 *
 * @param {Shantytown} oldVersion
 * @param {Shantytown} newVersion
 */
function getDiff(oldVersion, newVersion) {
    const properties = [
        'priority', 'builtAt', 'declaredAt', 'addressSimple', /* 'latitude', 'longitude', */
        'addressDetails', 'fieldType', 'ownerType', 'owner', 'censusStatus', 'censusConductedAt',
        'censusConductedBy', 'populationTotal', 'populationCouples', 'populationMinors',
        'socialOrigins', 'electricityType', 'accessToWater', 'trashEvacuation', 'ownerComplaint',
        'justiceProcedure', 'justiceRendered', 'justiceRenderedAt', 'justiceRenderedBy',
        'justiceChallenged', 'policeStatus', 'policeRequestedAt', 'policeGrantedAt', 'bailiff',
    ];

    const labels = {
        priority: 'Priorité',
        builtAt: 'Date d\'installation',
        declaredAt: 'Date de signalement',
        addressSimple: 'Adresse',
        latitude: 'Latitude',
        longitude: 'Longitude',
        addressDetails: 'Informations d\'accès',
        fieldType: 'Type de site',
        ownerType: 'Type de propriétaire',
        owner: 'Propriétaire',
        censusStatus: 'Statut du diagnostic',
        censusConductedAt: 'Date du diagnostic',
        censusConductedBy: 'Opérateur en charge du diagnostic',
        populationTotal: 'Nombre de personnes',
        populationCouples: 'Nombre de ménages',
        populationMinors: 'Nombre de mineurs',
        socialOrigins: 'Origines',
        electricityType: 'Accès à l\'électricité',
        accessToWater: 'Accès à l\'eau',
        trashEvacuation: 'Évacuation des déchets',
        ownerComplaint: 'Dépôt de plainte par le propriétaire',
        justiceProcedure: 'Existence d\'une procédure judiciaire',
        justiceRendered: 'Décision de justice rendue',
        justiceRenderedBy: 'Origine de la décision',
        justiceRenderedAt: 'Date de la décision',
        justiceChallenged: 'Contentieux relatif à la décision de justice',
        policeStatus: 'Concours de la force publique',
        policeRequestedAt: 'Date de la demande du CFP',
        policeGrantedAt: 'Date d\'octroi du CFP',
        bailiff: 'Nom de l\'étude d\'huissiers',
    };

    const baseProcessors = {
        default(value) {
            if (value === null || value === '') {
                return 'non renseigné';
            }

            return value;
        },
        date(ts) {
            if (ts === null) {
                return 'non renseignée';
            }

            return fromTsToFormat(ts, 'd M Y');
        },
        bool(b) {
            if (b === null) {
                return 'inconnu';
            }

            return b === true ? 'oui' : 'non';
        },
    };

    const processors = {
        builtAt: baseProcessors.date,
        declaredAt: baseProcessors.date,
        fieldType(f) {
            if (f === null) {
                return 'non renseigné';
            }

            return f.label;
        },
        ownerType(o) {
            if (o === null) {
                return 'non renseigné';
            }

            return o.label;
        },
        censusStatus(c) {
            const statuses = {
                [null]: 'inconnu',
                none: 'non prévu',
                scheduled: 'prévu',
                done: 'réalisé',
            };

            return statuses[c];
        },
        censusConductedAt: baseProcessors.date,
        socialOrigins(s) {
            if (s.length === 0) {
                return 'non renseignées';
            }

            const originLabels = s.map(({ label }) => label);
            if (originLabels.length === 1) {
                return originLabels[0];
            }

            return [
                originLabels.slice(0, originLabels.length - 1).join(', '),
                originLabels.slice(originLabels.length - 1),
            ].join(', et ');
        },
        electricityType(e) {
            if (e === null) {
                return 'non renseigné';
            }

            return e.label;
        },
        accessToWater: baseProcessors.bool,
        trashEvacuation: baseProcessors.bool,
        ownerComplaint: baseProcessors.bool,
        justiceProcedure: baseProcessors.bool,
        justiceRendered: baseProcessors.bool,
        justiceRenderedAt: baseProcessors.date,
        justiceChallenged: baseProcessors.bool,
        policeStatus(p) {
            const statuses = {
                [null]: 'inconnu',
                none: 'non demandé',
                requested: 'demandé',
                granted: 'obtenu',
            };

            return statuses[p];
        },
        policeRequestedAt: baseProcessors.date,
        policeGrantedAt: baseProcessors.date,
    };

    return properties.reduce((diff, property) => {
        const processor = processors[property] || baseProcessors.default;
        const oldValue = processor(oldVersion[property]);
        const newValue = processor(newVersion[property]);

        if (oldValue === newValue) {
            return diff;
        }

        return [
            ...diff,
            {
                field: labels[property],
                oldValue,
                newValue,
            },
        ];
    }, []);
}

/**
 * Serializes a single shantytown row
 *
 * @param {Object} town
 * @param {Object} permission
 *
 * @returns {Object}
 */
function serializeShantytown(town, permission) {
    const serializedTown = {
        id: town.id,
        status: town.status,
        latitude: town.latitude,
        longitude: town.longitude,
        city: {
            code: town.cityCode,
            name: town.cityName,
            main: town.cityMain,
        },
        epci: {
            code: town.epciCode,
            name: town.epciName,
        },
        departement: {
            code: town.departementCode,
            name: town.departementName,
        },
        region: {
            code: town.regionCode,
            name: town.regionName,
        },
        priority: town.priority,
        declaredAt: fromDateToTimestamp(town.declaredAt),
        builtAt: fromDateToTimestamp(town.builtAt),
        closedAt: town.closedAt !== null ? (town.closedAt.getTime() / 1000) : null,
        address: town.address,
        addressDetails: town.addressDetails,
        addressSimple: town.addressSimple || 'Pas d\'adresse précise',
        populationTotal: town.populationTotal,
        populationCouples: town.populationCouples,
        populationMinors: town.populationMinors,
        electricityType: {
            id: town.electricityTypeId,
            label: town.electricityTypeLabel,
        },
        accessToWater: town.accessToWater,
        trashEvacuation: town.trashEvacuation,
        owner: town.owner,
        censusStatus: town.censusStatus,
        censusConductedBy: town.censusConductedBy,
        censusConductedAt: fromDateToTimestamp(town.censusConductedAt),
        fieldType: {
            id: town.fieldTypeId,
            label: town.fieldTypeLabel,
        },
        ownerType: {
            id: town.ownerTypeId,
            label: town.ownerTypeLabel,
        },
        socialOrigins: [],
        comments: [],
        closingSolutions: [],
        actions: [],
        changelog: [],
        updatedAt: town.updatedAt !== null ? (town.updatedAt.getTime() / 1000) : null,
        updatedBy: {
            id: town.updatedById,
            first_name: town.updatedByFirstName,
            last_name: town.updatedByLastName,
            position: town.updatedByPosition,
            organization: {
                id: town.updatedByOrganization,
            },
        },
    };

    // @todo: alter all dates to a datetime so it can be easily serialized (just like closed_at)
    const restrictedData = {
        data_justice: {
            ownerComplaint: town.ownerComplaint,
            justiceProcedure: town.justiceProcedure,
            justiceRendered: town.justiceRendered,
            justiceRenderedAt: fromDateToTimestamp(town.justiceRenderedAt),
            justiceRenderedBy: town.justiceRenderedBy,
            justiceChallenged: town.justiceChallenged,
            policeStatus: town.policeStatus,
            policeRequestedAt: fromDateToTimestamp(town.policeRequestedAt),
            policeGrantedAt: fromDateToTimestamp(town.policeGrantedAt),
            bailiff: town.bailiff,
        },
    };

    Object.keys(restrictedData)
        .filter(dataPermission => permission[dataPermission] === true)
        .forEach((dataPermission) => {
            Object.assign(serializedTown, restrictedData[dataPermission]);
        });

    return serializedTown;
}

/**
 * Base SQL request
 */
function getBaseSql(table, whereClause = null, order = null) {
    return `SELECT
        shantytowns.shantytown_id AS id,
        shantytowns.priority,
        shantytowns.status,
        shantytowns.declared_at AS "declaredAt",
        shantytowns.built_at AS "builtAt",
        shantytowns.closed_at AS "closedAt",
        shantytowns.latitude,
        shantytowns.longitude,
        shantytowns.address,
        shantytowns.address_details AS "addressDetails",
        (SELECT regexp_matches(address, '^(.+) [0-9]+ [^,]+, [0-9]+,? [^, ]+(, [^,(]+( \\([^)]+\\))?)?$'))[1] AS "addressSimple",
        shantytowns.population_total AS "populationTotal",
        shantytowns.population_couples AS "populationCouples",
        shantytowns.population_minors AS "populationMinors",
        shantytowns.access_to_water AS "accessToWater",
        shantytowns.trash_evacuation AS "trashEvacuation",
        shantytowns.owner,
        shantytowns.census_status AS "censusStatus",
        shantytowns.census_conducted_by AS "censusConductedBy",
        shantytowns.census_conducted_at AS "censusConductedAt",
        shantytowns.owner_complaint AS "ownerComplaint",
        shantytowns.justice_procedure AS "justiceProcedure",
        shantytowns.justice_rendered AS "justiceRendered",
        shantytowns.justice_rendered_at AS "justiceRenderedAt",
        shantytowns.justice_rendered_by AS "justiceRenderedBy",
        shantytowns.justice_challenged AS "justiceChallenged",
        shantytowns.police_status AS "policeStatus",
        shantytowns.police_requested_at AS "policeRequestedAt",
        shantytowns.police_granted_at AS "policeGrantedAt",
        shantytowns.bailiff,
        shantytowns.updated_at AS "updatedAt",

        users.user_id AS "updatedById",
        users.first_name AS "updatedByFirstName",
        users.last_name AS "updatedByLastName",
        users.position AS "updatedByPosition",
        organizations.organization_id AS "updatedByOrganization",

        cities.code AS "cityCode",
        cities.name AS "cityName",
        cities.fk_main AS "cityMain",

        epci.code AS "epciCode",
        epci.name AS "epciName",

        departements.code AS "departementCode",
        departements.name AS "departementName",

        regions.code AS "regionCode",
        regions.name AS "regionName",

        electricity_types.electricity_type_id AS "electricityTypeId",
        electricity_types.label AS "electricityTypeLabel",

        field_types.field_type_id AS "fieldTypeId",
        field_types.label AS "fieldTypeLabel",

        owner_types.owner_type_id AS "ownerTypeId",
        owner_types.label AS "ownerTypeLabel"
    FROM "${table}" AS shantytowns
    LEFT JOIN owner_types ON shantytowns.fk_owner_type = owner_types.owner_type_id
    LEFT JOIN field_types ON shantytowns.fk_field_type = field_types.field_type_id
    LEFT JOIN electricity_types ON shantytowns.fk_electricity_type = electricity_types.electricity_type_id
    LEFT JOIN cities ON shantytowns.fk_city = cities.code
    LEFT JOIN epci ON cities.fk_epci = epci.code
    LEFT JOIN departements ON cities.fk_departement = departements.code
    LEFT JOIN regions ON departements.fk_region = regions.code
    LEFT JOIN users ON shantytowns.updated_by = users.user_id
    LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
    ${whereClause !== null ? `WHERE ${whereClause}` : ''}
    ${order !== null ? `ORDER BY ${order}` : ''}`;
}

/**
 * Fetches a list of shantytowns from the database
 *
 * @returns {Array.<Object>}
 */
async function query(database, where = [], user, feature, includeChangelog = false) {
    const replacements = {};

    const featureLevel = user.permissions.shantytown[feature].geographic_level;
    const userLevel = user.organization.location.type;
    if (featureLevel !== 'nation' && (featureLevel !== 'local' || userLevel !== 'nation')) {
        const level = featureLevel === 'local' ? userLevel : featureLevel;
        if (user.organization.location[level] === null) {
            return [];
        }

        where.push({
            location: {
                query: `${fromGeoLevelToTableName(level)}.code`,
                value: user.organization.location[level].code,
            },
        });
    }

    const whereClause = where.map((clauses, index) => {
        const clauseGroup = Object.keys(clauses).map((column) => {
            replacements[`${column}${index}`] = clauses[column].value || clauses[column];
            return `${clauses[column].query || `shantytowns.${column}`} ${clauses[column].not ? 'NOT ' : ''}IN (:${column}${index})`;
        }).join(' OR ');

        return `(${clauseGroup})`;
    }).join(' AND ');

    const towns = await database.query(
        getBaseSql(
            'shantytowns',
            where.length > 0 ? whereClause : null,
            ['departements.code ASC', 'cities.name ASC'].join(', '),
        ),
        {
            type: database.QueryTypes.SELECT,
            replacements,
        },
    );

    if (towns.length === 0) {
        return [];
    }

    const serializedTowns = towns.reduce(
        (object, town) => {
            /* eslint-disable no-param-reassign */
            object.hash[town.id] = serializeShantytown(town, user.permissions.shantytown[feature]);
            object.ordered.push(object.hash[town.id]);
            /* eslint-enable no-param-reassign */
            return object;
        },
        {
            hash: {},
            ordered: [],
        },
    );

    const promises = [];
    if (includeChangelog === true) {
        promises.push(
            database.query(
                getBaseSql(
                    'ShantytownHistories',
                    where.length > 0 ? whereClause : null,
                    ['shantytowns.shantytown_id ASC', 'shantytowns."archivedAt" ASC'].join(', '),
                ),
                {
                    type: database.QueryTypes.SELECT,
                    replacements,
                },
            ),
        );
    } else {
        promises.push(Promise.resolve(undefined));
    }

    promises.push(
        database.query(
            `SELECT
                shantytown_origins.fk_shantytown AS "shantytownId",
                social_origins.social_origin_id AS "socialOriginId",
                social_origins.label AS "socialOriginLabel"
            FROM shantytown_origins
            LEFT JOIN social_origins ON shantytown_origins.fk_social_origin = social_origins.social_origin_id
            WHERE shantytown_origins.fk_shantytown IN (:ids)`,
            {
                type: database.QueryTypes.SELECT,
                replacements: { ids: Object.keys(serializedTowns.hash) },
            },
        ),
    );

    if (user.isAllowedTo('list', 'shantytown_comment')) {
        promises.push(
            database.query(
                `SELECT
                    shantytown_comments.shantytown_comment_id AS "commentId",
                    shantytown_comments.fk_shantytown AS "shantytownId",
                    shantytown_comments.description AS "commentDescription",
                    shantytown_comments.created_at AS "commentCreatedAt",
                    shantytown_comments.created_by AS "commentCreatedBy",
                    users.first_name AS "userFirstName",
                    users.last_name AS "userLastName",
                    users.position AS "userPosition",
                    organizations.name AS "organizationName",
                    organizations.abbreviation AS "organizationAbbreviation"
                FROM shantytown_comments
                LEFT JOIN users ON shantytown_comments.created_by = users.user_id
                LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
                WHERE shantytown_comments.fk_shantytown IN (:ids)
                ORDER BY shantytown_comments.created_at DESC`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: { ids: Object.keys(serializedTowns.hash) },
                },
            ),
        );
    } else {
        promises.push(Promise.resolve(undefined));
    }

    promises.push(
        database.query(
            `SELECT
                shantytown_closing_solutions.fk_shantytown AS "shantytownId",
                closing_solutions.closing_solution_id AS "closingSolutionId",
                shantytown_closing_solutions.number_of_people_affected AS "peopleAffected",
                shantytown_closing_solutions.number_of_households_affected AS "householdsAffected"
            FROM shantytown_closing_solutions
            LEFT JOIN closing_solutions ON shantytown_closing_solutions.fk_closing_solution = closing_solutions.closing_solution_id
            WHERE shantytown_closing_solutions.fk_shantytown IN (:ids)`,
            {
                type: database.QueryTypes.SELECT,
                replacements: { ids: Object.keys(serializedTowns.hash) },
            },
        ),
    );

    const [history, socialOrigins, comments, closingSolutions] = await Promise.all(promises);

    if (history !== undefined && history.length > 0) {
        const serializedHistory = history.map(h => serializeShantytown(h, user.permissions.shantytown[feature]));
        for (let i = 1, { id } = serializedHistory[0]; i <= serializedHistory.length; i += 1) {
            if (!serializedHistory[i] || id !== serializedHistory[i].id) {
                if (!serializedTowns.hash[id]) {
                    // eslint-disable-next-line no-continue
                    continue;
                }

                const diff = getDiff(serializedHistory[i - 1], serializedTowns.hash[id]);
                if (diff.length > 0) {
                    serializedTowns.hash[id].changelog.unshift({
                        author: serializedTowns.hash[id].updatedBy,
                        date: serializedTowns.hash[id].updatedAt,
                        diff,
                    });
                }

                if (serializedHistory[i]) {
                    ({ id } = serializedHistory[i]);
                }

                // eslint-disable-next-line no-continue
                continue;
            }

            const diff = getDiff(serializedHistory[i - 1], serializedHistory[i]);
            if (diff.length > 0) {
                serializedTowns.hash[id].changelog.unshift({
                    author: serializedHistory[i].updatedBy,
                    date: serializedHistory[i].updatedAt,
                    diff,
                });
            }
        }
    }

    // @todo: move the serialization of these entities to their own model component
    if (socialOrigins !== undefined) {
        socialOrigins.forEach((socialOrigin) => {
            serializedTowns.hash[socialOrigin.shantytownId].socialOrigins.push({
                id: socialOrigin.socialOriginId,
                label: socialOrigin.socialOriginLabel,
            });
        });
    }

    if (comments !== undefined) {
        comments.forEach((comment) => {
            serializedTowns.hash[comment.shantytownId].comments.push({
                id: comment.commentId,
                description: comment.commentDescription,
                createdAt: comment.commentCreatedAt !== null ? (comment.commentCreatedAt.getTime() / 1000) : null,
                createdBy: {
                    id: comment.commentCreatedBy,
                    firstName: comment.userFirstName,
                    lastName: comment.userLastName,
                    position: comment.userPosition,
                    organization: comment.organizationAbbreviation || comment.organizationName,
                },
            });
        });
    }

    if (closingSolutions !== undefined) {
        closingSolutions.forEach((closingSolution) => {
            serializedTowns.hash[closingSolution.shantytownId].closingSolutions.push({
                id: closingSolution.closingSolutionId,
                peopleAffected: closingSolution.peopleAffected,
                householdsAffected: closingSolution.householdsAffected,
            });
        });
    }

    return serializedTowns.ordered;
}

module.exports = database => ({
    findAll: (user, filters = [], feature = 'list') => query(database, filters, user, feature),

    findOne: async (user, shantytownId) => {
        const towns = await query(
            database,
            [{ shantytown_id: shantytownId }],
            user,
            'read',
            true, // include changelog
        );
        return towns.length === 1 ? towns[0] : null;
    },

    findComments: () => database.query(
        `SELECT
                shantytown_comments.shantytown_comment_id AS "commentId",
                shantytown_comments.fk_shantytown AS "shantytownId",
                shantytown_comments.description AS "commentDescription",
                shantytown_comments.created_at AS "commentCreatedAt",
                shantytown_comments.created_by AS "commentCreatedBy",
                users.first_name AS "userFirstName",
                users.last_name AS "userLastName",
                users.position AS "userPosition",
                organizations.name AS "organizationName",
                organizations.abbreviation AS "organizationAbbreviation"
            FROM shantytown_comments
            LEFT JOIN users ON shantytown_comments.created_by = users.user_id
            LEFT JOIN organizations ON users.fk_organization = organizations.organization_id
            ORDER BY shantytown_comments.created_at DESC
            LIMIT 100`,
        {
            type: database.QueryTypes.SELECT,
        },
    ),
});
