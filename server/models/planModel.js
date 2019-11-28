const locationTypes = {
    shantytowns: 'sur site(s) : bidonville ou squat',
    location: 'sur terrain d\'insertion',
    housing: 'dans le logement',
    other: 'dans plusieurs lieux',
};

/**
 * Serializes a single plan row
 *
 * @param {Object} plan
 *
 * @returns {Object}
 */
function serializePlan(plan) {
    const base = {
        id: plan.id,
        name: plan.name,
        started_at: new Date(plan.startedAt).getTime(),
        expected_to_end_at: plan.expectedToEndAt ? (new Date(plan.expectedToEndAt).getTime()) : null,
        in_and_out: plan.inAndOut === true,
        goals: plan.goals,
        location_type: {
            id: plan.locationType,
            label: locationTypes[plan.locationType],
        },
        location_details: plan.locationDetails,
        government_contacts: plan.managers,
        departement: plan.managers[0].organization.location.departement.code,
        operator_contacts: plan.operators,
        fundings: [

        ],
        topics: plan.topics,
        createdBy: plan.createdBy,
        updatedBy: plan.updatedBy,
    };

    switch (plan.locationType) {
        case 'location':
            base.location = {
                label: plan.location_address_simple,
                address: plan.location_address,
                latitude: plan.location_latitude,
                longitude: plan.location_longitude,
            };
            break;

        case 'shantytowns':
            base.shantytowns = plan.shantytowns;
            break;

        default:
    }

    return base;
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

module.exports = (database) => {
    // eslint-disable-next-line global-require
    const userModel = require('./userModel')(database);
    // eslint-disable-next-line global-require
    const shantytownModel = require('./shantytownModel')(database);
    async function query(user, feature, filters = {}) {
        const where = [];
        const replacements = Object.assign({}, filters);

        // check if a location filter should be applied (ie. the feature is not allowed on a national level)
        const featureLevel = user.permissions.plan[feature].geographic_level;
        const userLevel = user.organization.location.type;

        if (featureLevel !== 'nation' && (featureLevel !== 'local' || userLevel !== 'nation')) {
            const level = featureLevel === 'local' ? userLevel : featureLevel;
            if (user.organization.location[level] === null) {
                return [];
            }

            where.push(`${fromGeoLevelToTableName(level)}.code = :locationCode`);
            replacements.locationCode = user.organization.location[level].code;
        }

        // integrate custom filters
        const filterParts = [];
        Object.keys(filters).forEach((column) => {
            filterParts.push(`plans.${column} IN (:${column})`);
        });

        if (filterParts.length > 0) {
            where.push(filterParts.join(' OR '));
        }

        const rows = await database.query(
            `SELECT
                plans.plan_id AS id,
                plans.name AS "name",
                plans.started_at AS "startedAt",
                plans.expected_to_end_at AS "expectedToEndAt",
                plans.in_and_out AS "inAndOut",
                plans.goals AS "goals",
                plans.location_type AS "locationType",
                plans.location_details AS "locationDetails",
                locations.address AS "location_address",
                (SELECT regexp_matches(locations.address, '^(.+) [0-9]+ [^,]+,? [0-9]+,? [^, ]+(,.+)?$'))[1] AS "location_address_simple",
                locations.latitude AS "location_latitude",
                locations.longitude AS "location_longitude",
                plans.created_by AS "createdBy",
                plans.updated_by AS "updatedBy",
                plan_categories.uid AS "planCategoryUid",
                plan_categories.name AS "planCategoryName"
            FROM plans2 AS plans
            LEFT JOIN plan_categories ON plans.fk_category = plan_categories.uid
            LEFT JOIN locations ON plans.fk_location = locations.location_id
            ${where.length > 0 ? `WHERE (${where.join(') AND (')})` : ''}
            ORDER BY plans.plan_id ASC`,
            {
                type: database.QueryTypes.SELECT,
                replacements,
            },
        );

        if (rows.length === 0) {
            return [];
        }

        const hashedPlans = rows.reduce((acc, plan) => Object.assign(acc, {
            [plan.id]: plan,
        }), {});

        const planIds = rows.map(({ id }) => id);
        const [planManagers, planOperators, planTopics, planStates, planShantytowns, planFinances] = await Promise.all([
            database.query(
                'SELECT fk_plan, fk_user FROM plan_managers WHERE fk_plan IN (:planIds) ORDER BY fk_plan ASC',
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
            database.query(
                'SELECT fk_plan, fk_user FROM plan_operators WHERE fk_plan IN (:planIds) ORDER BY fk_plan ASC',
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
            database.query(
                `SELECT
                    plan_topics.fk_plan,
                    topics.uid AS topic_uid,
                    topics.name AS topic_name
                FROM plan_topics
                LEFT JOIN topics ON plan_topics.fk_topic = topics.uid
                WHERE plan_topics.fk_plan IN (:planIds) ORDER BY plan_topics.fk_plan ASC`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
            database.query(
                `SELECT
                    plan_states.plan_state_id,
                    plan_states.date,
                    plan_states.fk_plan,
                    audience_in.total AS in_total,
                    audience_in.families AS in_families,
                    audience_in.women AS in_women,
                    audience_in.minors AS in_minors,
                    audience_out_positive.total AS out_positive_total,
                    audience_out_positive.families AS out_positive_families,
                    audience_out_positive.women AS out_positive_women,
                    audience_out_positive.minors AS out_positive_minors,
                    audience_out_abandoned.total AS out_abandoned_total,
                    audience_out_abandoned.families AS out_abandoned_families,
                    audience_out_abandoned.women AS out_abandoned_women,
                    audience_out_abandoned.minors AS out_abandoned_minors,
                    audience_out_excluded.total AS out_excluded_total,
                    audience_out_excluded.families AS out_excluded_families,
                    audience_out_excluded.women AS out_excluded_women,
                    audience_out_excluded.minors AS out_excluded_minors,
                    indicateurs_droit_commun.domiciliation,
                    indicateurs_droit_commun.droits_caf,
                    indicateurs_droit_commun.emploi_stable,
                    indicateurs_sante.ame_valide,
                    indicateurs_sante.puma_valide,
                    indicateurs_sante.ame_en_cours,
                    indicateurs_sante.puma_en_cours,
                    indicateurs_sante.orientation,
                    indicateurs_sante.accompagnement,
                    indicateurs_logement.siao,
                    indicateurs_logement.logement_social,
                    indicateurs_logement.dalo,
                    indicateurs_logement.accompagnes,
                    indicateurs_logement.non_accompagnes,
                    indicateurs_logement.heberges,
                    indicateurs_formation.pole_emploi,
                    indicateurs_formation.pole_emploi_femmes,
                    indicateurs_formation.mission_locale,
                    indicateurs_formation.mission_locale_femmes,
                    indicateurs_formation.contrats,
                    indicateurs_formation.contrats_femmes,
                    indicateurs_formation.autoentrepreneurs,
                    indicateurs_formation.autoentrepreneurs_femmes,
                    indicateurs_formation.are,
                    indicateurs_formation.are_femmes,
                    indicateurs_education.scolarisables,
                    indicateurs_education.maternelles,
                    indicateurs_education.elementaires,
                    indicateurs_education.colleges,
                    indicateurs_education.lycees,
                    indicateurs_education.difficulte_cantine,
                    indicateurs_education.difficculte_place_up2a,
                    indicateurs_education.difficulte_transport,
                    indicateurs_securisation.points_eau,
                    indicateurs_securisation.wc,
                    indicateurs_securisation.douches,
                    indicateurs_securisation.electricite,
                    frequence_dechets.uid AS frequence_dechets_uid,
                    frequence_dechets.name AS frequence_dechets_name
                FROM plan_states
                LEFT JOIN audiences audience_in ON plan_states.fk_audience_in = audience_in.audience_id
                LEFT JOIN audiences audience_out_positive ON plan_states.fk_audience_out_positive = audience_out_positive.audience_id
                LEFT JOIN audiences audience_out_abandoned ON plan_states.fk_audience_out_abandoned = audience_out_abandoned.audience_id
                LEFT JOIN audiences audience_out_excluded ON plan_states.fk_audience_out_excluded = audience_out_excluded.audience_id
                LEFT JOIN indicateurs_droit_commun ON plan_states.fk_indicateurs_commun = indicateurs_droit_commun.indicateurs_droit_commun_id
                LEFT JOIN indicateurs_sante ON plan_states.fk_indicateurs_sante = indicateurs_sante.indicateurs_sante_id
                LEFT JOIN indicateurs_logement ON plan_states.fk_indicateurs_logement = indicateurs_logement.indicateurs_logement_id
                LEFT JOIN indicateurs_formation ON plan_states.fk_indicateurs_formation = indicateurs_formation.indicateurs_formation_id
                LEFT JOIN indicateurs_education ON plan_states.fk_indicateurs_education = indicateurs_education.indicateurs_education_id
                LEFT JOIN indicateurs_securisation ON plan_states.fk_indicateurs_securisation = indicateurs_securisation.indicateurs_securisation_id
                LEFT JOIN frequence_dechets ON indicateurs_securisation.frequence_dechets = frequence_dechets.uid
                WHERE fk_plan IN (:planIds)
                ORDER BY fk_plan, date ASC`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
            database.query(
                'SELECT fk_plan, fk_shantytown FROM plan_shantytowns WHERE fk_plan IN (:planIds) ORDER BY fk_plan ASC',
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
            database.query(
                `SELECT
                    finances.fk_plan,
                    finances.finance_id,
                    finances.year,
                    finances.closed,
                    finance_rows.amount,
                    finance_rows.comments,
                    finance_types.uid AS finance_type_uid,
                    finance_types.name AS finance_type_name
                FROM
                    finances
                LEFT JOIN finance_rows ON finance_rows.fk_finance = finances.finance_id
                LEFT JOIN finance_types ON finance_rows.fk_finance_type = finance_types.uid
                WHERE finances.fk_plan IN (:planIds) ORDER BY fk_plan ASC, finances.year ASC`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            ),
        ]);

        // users
        const serializedUsers = await userModel.findByIds(
            user,
            [...planManagers, ...planOperators].map(({ fk_user: id }) => id),
        );
        const hashedUsers = serializedUsers.reduce((acc, u) => Object.assign(acc, {
            [u.id]: u,
        }), {});

        planManagers.forEach(({ fk_plan: planId, fk_user: userId }) => {
            if (hashedPlans[planId].managers === undefined) {
                hashedPlans[planId].managers = [];
                hashedPlans[planId].location = hashedUsers[userId].organization.location;
            }

            hashedPlans[planId].managers.push(hashedUsers[userId]);
        });
        planOperators.forEach(({ fk_plan: planId, fk_user: userId }) => {
            if (hashedPlans[planId].operators === undefined) {
                hashedPlans[planId].operators = [];
            }

            hashedPlans[planId].operators.push(hashedUsers[userId]);
        });

        // topics
        planTopics.forEach(({ fk_plan: planId, topic_uid: uid, topic_name: name }) => {
            if (hashedPlans[planId].topics === undefined) {
                hashedPlans[planId].topics = [];
            }

            hashedPlans[planId].topics.push({
                uid,
                name,
            });
        });

        // plan states
        const planStateIds = planStates.map(({ plan_state_id: id }) => id);
        if (planStateIds.length > 0) {
            await database.query(
                `SELECT
                    plan_state_etp.fk_plan_state,
                    plan_state_etp.total,
                    etp_types.uid AS etp_type_uid,
                    etp_types.name AS etp_type_name
                FROM plan_state_etp
                LEFT JOIN etp_types ON plan_state_etp.fk_etp_type = etp_types.uid
                WHERE plan_state_etp.fk_plan_state IN (:planStateIds)`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planStateIds,
                    },
                },
            );
        }

        const parsedPlanStates = planStates.reduce((acc, state) => {
            if (acc[state.fk_plan] === undefined) {
                acc[state.fk_plan] = [];
            }

            acc[state.fk_plan].push({
                id: state.plan_state_id,
                date: state.date,
                audience: {
                    in: {
                        total: state.in_total,
                        families: state.in_families,
                        wowen: state.in_women,
                        minors: state.in_minors,
                    },
                    out_positive: state.out_positive_total !== null ? {
                        total: state.out_positive_total,
                        families: state.out_positive_families,
                        wowen: state.out_positive_women,
                        minors: state.out_positive_minors,
                    } : null,
                    out_abandoned: state.out_abandoned_total !== null ? {
                        total: state.out_abandoned_total,
                        families: state.out_abandoned_families,
                        wowen: state.out_abandoned_women,
                        minors: state.out_abandoned_minors,
                    } : null,
                    out_excluded: state.out_excluded_total !== null ? {
                        total: state.out_excluded_total,
                        families: state.out_excluded_families,
                        wowen: state.out_excluded_women,
                        minors: state.out_excluded_minors,
                    } : null,
                },
                droit_commun: state.domiciliation !== null ? {
                    domiciliation: state.domiciliation,
                    droits_caf: state.droits_caf,
                    emploi_stable: state.emploi_stable,
                } : null,
                sante: state.ame_valide !== null ? {
                    ame_valide: state.ame_valide,
                    puma_valide: state.puma_valide,
                    ame_en_cours: state.ame_en_cours,
                    puma_en_cours: state.puma_en_cours,
                    orientation: state.orientation,
                    accompagnement: state.accompagnement,
                } : null,
                logement: state.siao !== null ? {
                    siao: state.siao,
                    logement_social: state.logement_social,
                    dalo: state.dalo,
                    accompagnes: state.accompagnes,
                    non_accompagnes: state.non_accompagnes,
                    heberges: state.heberges,
                } : null,
                formation: state.pole_emploi !== null ? {
                    pole_emploi: state.pole_emploi,
                    pole_emploi_femmes: state.pole_emploi_femmes,
                    mission_locale: state.mission_locale,
                    mission_locale_femmes: state.mission_locale_femmes,
                    contrats: state.contrats,
                    contrats_femmes: state.contrats_femmes,
                    autoentrepreneurs: state.autoentrepreneurs,
                    autoentrepreneurs_femmes: state.autoentrepreneurs_femmes,
                    are: state.are,
                    are_femmes: state.are_femmes,
                } : null,
                education: state.scolarisables !== null ? {
                    scolarisables: state.scolarisables,
                    maternelles: state.maternelles,
                    elementaires: state.elementaires,
                    colleges: state.colleges,
                    lycees: state.lycees,
                    difficulte_cantine: state.difficulte_cantine,
                    difficculte_place_up2a: state.difficculte_place_up2a,
                    difficulte_transport: state.difficulte_transport,
                } : null,
                securisation: state.points_eau !== null ? {
                    points_eau: state.points_eau,
                    wc: state.wc,
                    douches: state.douches,
                    electricite: state.electricite,
                } : null,
            });

            return acc;
        }, {});
        Object.keys(parsedPlanStates).forEach((planId) => {
            hashedPlans[planId].states = parsedPlanStates[planId];
        });

        // shantytowns
        let hashedShantytowns = {};

        if (planShantytowns.length > 0) {
            const serializedShantytowns = await shantytownModel.findAll(
                user,
                [{ shantytown_id: planShantytowns.map(({ fk_shantytown: id }) => id) }],
            );
            hashedShantytowns = serializedShantytowns.reduce((acc, shantytown) => Object.assign(acc, {
                [shantytown.id]: shantytown,
            }), {});
        }

        planShantytowns.forEach(({ fk_plan: planId, fk_shantytown: shantytownId }) => {
            if (hashedPlans[planId].shantytowns === undefined) {
                hashedPlans[planId].shantytowns = [];
            }

            hashedPlans[planId].shantytowns.push(hashedShantytowns[shantytownId]);
        });

        // finances
        planFinances.forEach((finance) => {
            if (hashedPlans[finance.fk_plan].finances === undefined) {
                hashedPlans[finance.fk_plan].finances = [];
            }

            let yearGroup = hashedPlans[finance.fk_plan].finances.find(({ year }) => year === finance.year);
            if (yearGroup === undefined) {
                yearGroup = {
                    year: finance.year,
                    data: [],
                };
                hashedPlans[finance.fk_plan].finances.push(yearGroup);
            }

            yearGroup.data.push({
                type: {
                    uid: finance.finance_type_uid,
                    name: finance.finance_type_name,
                },
                amount: finance.amount,
                details: finance.comments,
            });
        });

        return rows.map(serializePlan);
    }

    return {
        findAll: user => query(user, 'list'),

        findOne: async (user, id) => {
            const rows = await query(user, 'read', {
                plan_id: id,
            });

            if (rows.length === 1) {
                return rows[0];
            }

            return null;
        },

        delete: planId => database.query(
            'DELETE FROM plans WHERE plan_id = :planId',
            {
                replacements: {
                    planId,
                },
            },
        ),

        create: async (data) => {
            const response = await database.query(
                `INSERT INTO
                    plans(
                        name,
                        started_at,
                        targeted_on_towns,
                        fk_type,
                        fk_departement,
                        created_by,
                        updated_by
                    )
                VALUES (
                    :name,
                    :startedAt,
                    :targeted,
                    :type,
                    :departement,
                    :createdBy,
                    :updatedBy
                )
                RETURNING plan_id`,
                {
                    replacements: {
                        name: data.name || null,
                        startedAt: data.startedAt,
                        targeted: data.targetedOnTowns,
                        type: data.type,
                        departement: data.departement,
                        createdBy: data.createdBy,
                        updatedBy: data.createdBy,
                    },
                },
            );

            const planId = response[0][0].plan_id;

            if (data.funding && data.funding.length > 0) {
                const year = (new Date()).getFullYear();
                const replacements = [];
                let replacementValues = {};
                data.funding.forEach(({ amount, details, type }, index) => {
                    replacementValues = Object.assign({}, replacementValues, {
                        [`year${index}`]: year,
                        [`amount${index}`]: parseFloat(amount),
                        [`details${index}`]: details,
                        [`plan${index}`]: planId,
                        [`type${index}`]: parseInt(type, 10),
                        [`created${index}`]: data.createdBy,
                        [`updated${index}`]: data.createdBy,
                    });

                    replacements.push([
                        `:year${index}`,
                        `:amount${index}`,
                        `:details${index}`,
                        `:plan${index}`,
                        `:type${index}`,
                        `:created${index}`,
                        `:updated${index}`,
                    ].join(','));
                });

                await database.query(
                    `INSERT INTO plan_fundings(
                        year, amount, details, fk_plan, fk_type, created_by, updated_by
                    )
                    VALUES (${replacements.join('),(')})`,
                    {
                        replacements: replacementValues,
                    },
                );
            }

            if (data.targetedOnTowns === true && data.towns && data.towns.length) {
                const replacements = [];
                let replacementValues = {};
                data.towns.forEach((townId, index) => {
                    replacementValues = Object.assign({}, replacementValues, {
                        [`plan${index}`]: planId,
                        [`town${index}`]: townId,
                        [`created${index}`]: data.createdBy,
                        [`updated${index}`]: data.createdBy,
                    });

                    replacements.push([
                        `:plan${index}`,
                        `:town${index}`,
                        `:created${index}`,
                        `:updated${index}`,
                    ].join(','));
                });

                await database.query(
                    `INSERT INTO plan_details(
                        fk_plan, fk_shantytown, created_by, updated_by
                    )
                    VALUES (${replacements.join('),(')})`,
                    {
                        replacements: replacementValues,
                    },
                );
            } else {
                await database.query(
                    `INSERT INTO plan_details(
                        fk_plan, fk_shantytown, created_by, updated_by
                    )
                    VALUES (:planId, NULL, :creatorId, :creatorId)`,
                    {
                        replacements: {
                            planId,
                            creatorId: data.createdBy,
                        },
                    },
                );
            }

            return planId;
        },

        addTown: async (planId, townId, createdBy) => {
            await database.query(
                `INSERT INTO plan_details(
                    fk_plan, fk_shantytown, created_by, updated_by
                )
                VALUES (:planId, :townId, :createdBy, :createdBy)`,
                {
                    replacements: {
                        planId,
                        townId,
                        createdBy,
                    },
                },
            );
        },

        updateDetails: async (id, data) => {
            await database.query(
                `UPDATE
                    plan_details
                SET
                    households_affected = :householdsAffected,
                    people_affected = :peopleAffected,
                    children_schoolable = :childrenSchoolable,
                    households_who_got_housing_with_help = :householdsWhoGotHousingWithHelp,
                    households_who_got_housing_without_help = :householdsWhoGotHousingWithoutHelp,
                    households_who_were_hosted = :householdsWhoWereHosted,
                    children_schooled = :childrenSchooled,
                    people_accessing_health = :peopleAccessingHealth,
                    people_helped_for_employment = :peopleHelpedForEmployment,
                    people_who_got_employment = :peopleWhoGotEmployment,
                    households_domiciled = :householdsDomiciled,
                    people_included = :peopleIncluded,
                    people_successfully_helped = :peopleSuccessfullyHelped,
                    people_excluded = :peopleExcluded,
                    people_who_resigned = :peopleWhoResigned,
                    people_pole_emploi = :peoplePoleEmploi,
                    people_mission_locale = :peopleMissionLocale,
                    people_with_bank_account = :peopleWithBankAccount,
                    people_trainee = :peopleTrainee,
                    average_duration = :averageDuration,
                    households = :households,
                    people = :people,
                    european_people = :europeanPeople,
                    french_people = :frenchPeople,
                    non_european_people = :nonEuropeanPeople,
                    young_kids = :youngKids,
                    other_kids = :otherKids,
                    schooled_kids = :schooledKids,
                    people_asking_for_cmu = :peopleAskingForCmu,
                    people_with_cmu = :peopleWithCmu,
                    minors_with_admin_procedure = :minorsWithAdminProcedure,
                    minors_with_justice_procedure = :minorsWithJusticeProcedure
                WHERE plan_shantytown_id = :id`,
                {
                    replacements: {
                        id,
                        householdsAffected: data.householdsAffected || null,
                        peopleAffected: data.peopleAffected || null,
                        childrenSchoolable: data.childrenSchoolable || null,
                        householdsWhoGotHousingWithHelp: data.householdsWhoGotHousingWithHelp || null,
                        householdsWhoGotHousingWithoutHelp: data.householdsWhoGotHousingWithoutHelp || null,
                        householdsWhoWereHosted: data.householdsWhoWereHosted || null,
                        childrenSchooled: data.childrenSchooled || null,
                        peopleAccessingHealth: data.peopleAccessingHealth || null,
                        peopleHelpedForEmployment: data.peopleHelpedForEmployment || null,
                        peopleWhoGotEmployment: data.peopleWhoGotEmployment || null,
                        householdsDomiciled: data.householdsDomiciled || null,
                        peopleIncluded: data.peopleIncluded || null,
                        peopleSuccessfullyHelped: data.peopleSuccessfullyHelped || null,
                        peopleExcluded: data.peopleExcluded || null,
                        peopleWhoResigned: data.peopleWhoResigned || null,
                        peoplePoleEmploi: data.peoplePoleEmploi || null,
                        peopleMissionLocale: data.peopleMissionLocale || null,
                        peopleWithBankAccount: data.peopleWithBankAccount || null,
                        peopleTrainee: data.peopleTrainee || null,
                        averageDuration: data.averageDuration || null,
                        households: data.households || null,
                        people: data.people || null,
                        europeanPeople: data.europeanPeople || null,
                        frenchPeople: data.frenchPeople || null,
                        nonEuropeanPeople: data.nonEuropeanPeople || null,
                        youngKids: data.youngKids || null,
                        otherKids: data.otherKids || null,
                        schooledKids: data.schooledKids || null,
                        peopleAskingForCmu: data.peopleAskingForCmu || null,
                        peopleWithCmu: data.peopleWithCmu || null,
                        minorsWithAdminProcedure: data.minorsWithAdminProcedure || null,
                        minorsWithJusticeProcedure: data.minorsWithJusticeProcedure || null,
                    },
                },
            );
        },
    };
};
