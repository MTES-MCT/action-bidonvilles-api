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

/**
 * Serializes a single shantytown row
 *
 * @param {Object}         town
 * @param {Array.<string>} permissions The list of granted permissions
 *
 * @returns {Object}
 */
function serializeShantytown(town, permissions) {
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
    };

    // @todo: alter all dates to a datetime so it can be easily serialized (just like closed_at)
    const restrictedData = {
        priority: town.priority,
        declaredAt: fromDateToTimestamp(town.declaredAt),
        builtAt: fromDateToTimestamp(town.builtAt),
        closedAt: town.closedAt !== null ? (town.closedAt.getTime() / 1000) : null,
        address: town.address,
        addressDetails: town.addressDetails,
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
        updatedAt: town.updatedAt !== null ? (town.updatedAt.getTime() / 1000) : null,
    };

    Object.keys(restrictedData).filter(data => permissions.indexOf(data) !== -1).forEach((data) => {
        serializedTown[data] = restrictedData[data];
    });

    return serializedTown;
}

/**
 * Fetches a list of shantytowns from the database
 *
 * @param {Sequelize}             database
 * @param {Object.<string,Array>} filters     The list of towns to be fetched
 * @param {Array.<string>}        permissions The list of granted permissions
 *
 * @returns {Array.<Object>}
 */
async function query(database, filters = {}, permissions, departement) {
    const filterParts = [];
    Object.keys(filters).forEach((column) => {
        filterParts.push(`shantytowns.${column} IN (:${column})`);
    });

    let where = filterParts.join(' OR ');
    if (permissions.indexOf('local') !== -1 && departement !== null) {
        if (where !== '') {
            where = `(${where}) AND departements.code = '${departement}'`;
        } else {
            where = `departements.code = '${departement}'`;
        }
    }

    const towns = await database.query(
        `SELECT
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

            cities.code AS "cityCode",
            cities.name AS "cityName",
            cities.fk_main AS "cityMain",

            epci.code AS "epciCode",
            epci.name AS "epciName",

            departements.code AS "departementCode",
            departements.name AS "departementName",

            electricity_types.electricity_type_id AS "electricityTypeId",
            electricity_types.label AS "electricityTypeLabel",

            field_types.field_type_id AS "fieldTypeId",
            field_types.label AS "fieldTypeLabel",

            owner_types.owner_type_id AS "ownerTypeId",
            owner_types.label AS "ownerTypeLabel"
        FROM shantytowns
        LEFT JOIN owner_types ON shantytowns.fk_owner_type = owner_types.owner_type_id
        LEFT JOIN field_types ON shantytowns.fk_field_type = field_types.field_type_id
        LEFT JOIN electricity_types ON shantytowns.fk_electricity_type = electricity_types.electricity_type_id
        LEFT JOIN cities ON shantytowns.fk_city = cities.code
        LEFT JOIN epci ON cities.fk_epci = epci.code
        LEFT JOIN departements ON cities.fk_departement = departements.code
        ${where !== '' ? `WHERE ${where}` : ''}
        ORDER BY departements.code ASC, cities.name ASC`,
        {
            type: database.QueryTypes.SELECT,
            replacements: filters,
        },
    );

    if (towns.length === 0) {
        return [];
    }

    const serializedTowns = towns.reduce(
        (object, town) => {
            /* eslint-disable no-param-reassign */
            object.hash[town.id] = serializeShantytown(town, permissions);
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
    if (permissions.indexOf('socialOrigins') !== -1) {
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
    } else {
        promises.push(Promise.resolve(undefined));
    }

    if (permissions.indexOf('comments') !== -1) {
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
                    users.company AS "userCompany"
                FROM shantytown_comments
                LEFT JOIN users ON shantytown_comments.created_by = users.user_id
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

    if (permissions.indexOf('closingSolutions') !== -1) {
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
    } else {
        promises.push(Promise.resolve(undefined));
    }

    const [socialOrigins, comments, closingSolutions] = await Promise.all(promises);

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
                    company: comment.userCompany,
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
    findAll: (permissions = [], departement = null, filters = []) => query(database, filters, permissions, departement),

    findOne: async (shantytownId, permissions = [], departement = null) => {
        const towns = await query(database, { shantytown_id: [shantytownId] }, permissions, departement);
        return towns.length === 1 ? towns[0] : null;
    },
});
