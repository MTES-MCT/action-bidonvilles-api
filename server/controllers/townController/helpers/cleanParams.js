function getFloatOrNull(str) {
    const parsed = parseFloat(str);
    return !Number.isNaN(parsed) ? parsed : null;
}

function getIntOrNull(str) {
    const parsed = parseInt(str, 10);
    return !Number.isNaN(parsed) ? parsed : null;
}

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

module.exports = function cleanParams(body, format) {
    let priority;
    let built_at;
    let status;
    let closed_at;
    let latitude;
    let longitude;
    let city;
    let citycode;
    let address;
    let detailed_address;
    let population_total;
    let population_couples;
    let population_minors;
    let electricity_type;
    let electricity_comments;
    let access_to_water;
    let water_comments;
    let trash_evacuation;
    let owner_complaint;
    let justice_procedure;
    let justice_rendered;
    let justice_rendered_by;
    let justice_rendered_at;
    let justice_challenged;
    let social_origins;
    let field_type;
    let owner_type;
    let owner;
    let declared_at;
    let census_status;
    let census_conducted_at;
    let census_conducted_by;
    let police_status;
    let police_requested_at;
    let police_granted_at;
    let bailiff;
    let solutions;
    let closed_with_solutions;

    if (format === 'camel') {
        ({
            priority,
            builtAt: built_at,
            status,
            closedAt: closed_at,
            latitude,
            longitude,
            city,
            citycode,
            address,
            detailedAddress: detailed_address,
            populationTotal: population_total,
            populationCouples: population_couples,
            populationMinors: population_minors,
            electricityType: electricity_type,
            electricityComments: electricity_comments,
            accessToWater: access_to_water,
            waterComments: water_comments,
            trashEvacuation: trash_evacuation,
            ownerComplaint: owner_complaint,
            justiceProcedure: justice_procedure,
            justiceRendered: justice_rendered,
            justiceRenderedBy: justice_rendered_by,
            justiceRenderedAt: justice_rendered_at,
            justiceChallenged: justice_challenged,
            socialOrigins: social_origins,
            fieldType: field_type,
            ownerType: owner_type,
            owner,
            declaredAt: declared_at,
            censusStatus: census_status,
            censusConductedAt: census_conducted_at,
            censusConductedBy: census_conducted_by,
            policeStatus: police_status,
            policeRequestedAt: police_requested_at,
            policeGrantedAt: police_granted_at,
            bailiff,
            solutions,
            closedWithSolutions: closed_with_solutions,
        } = body);
    } else {
        ({
            priority,
            built_at,
            status,
            closed_at,
            latitude,
            longitude,
            city,
            citycode,
            address,
            detailed_address,
            population_total,
            population_couples,
            population_minors,
            electricity_type,
            electricity_comments,
            access_to_water,
            water_comments,
            trash_evacuation,
            owner_complaint,
            justice_procedure,
            justice_rendered,
            justice_rendered_by,
            justice_rendered_at,
            justice_challenged,
            social_origins,
            field_type,
            owner_type,
            owner,
            declared_at,
            census_status,
            census_conducted_at,
            census_conducted_by,
            police_status,
            police_requested_at,
            police_granted_at,
            bailiff,
            solutions,
            closed_with_solutions,
        } = body);
    }

    return {
        priority: getIntOrNull(priority),
        builtAt: built_at !== '' ? built_at : null,
        status: trim(status),
        closedAt: closed_at,
        latitude: getFloatOrNull(latitude),
        longitude: getFloatOrNull(longitude),
        city: trim(city),
        citycode: trim(citycode),
        address: trim(address),
        addressDetails: trim(detailed_address),
        populationTotal: getIntOrNull(population_total),
        populationCouples: getIntOrNull(population_couples),
        populationMinors: getIntOrNull(population_minors),
        electricityType: getIntOrNull(electricity_type),
        electricityComments: trim(electricity_comments),
        accessToWater: getIntOrNull(access_to_water),
        waterComments: trim(water_comments),
        trashEvacuation: getIntOrNull(trash_evacuation),
        ownerComplaint: getIntOrNull(owner_complaint),
        justiceProcedure: getIntOrNull(justice_procedure),
        justiceRendered: getIntOrNull(justice_rendered),
        justiceRenderedBy: trim(justice_rendered_by),
        justiceRenderedAt: justice_rendered_at !== '' ? justice_rendered_at : null,
        justiceChallenged: getIntOrNull(justice_challenged),
        socialOrigins: social_origins || [],
        fieldType: getIntOrNull(field_type),
        ownerType: getIntOrNull(owner_type),
        owner: trim(owner),
        declaredAt: declared_at !== '' ? declared_at : null,
        censusStatus: trim(census_status),
        censusConductedAt: census_conducted_at !== '' ? census_conducted_at : null,
        censusConductedBy: trim(census_conducted_by),
        policeStatus: trim(police_status),
        policeRequestedAt: police_requested_at !== '' ? police_requested_at : null,
        policeGrantedAt: police_granted_at !== '' ? police_granted_at : null,
        bailiff: trim(bailiff),
        solutions: solutions ? solutions.map(solution => ({
            id: parseInt(solution.id, 10),
            peopleAffected: getIntOrNull(solution.peopleAffected),
            householdsAffected: getIntOrNull(solution.householdsAffected),
        })) : [],
        closedWithSolutions: typeof closed_with_solutions === 'boolean' ? closed_with_solutions : null,
    };
};
