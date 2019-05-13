/**
 * Serializes a single plan row
 *
 * @param {Object} plan
 *
 * @returns {Object}
 */
function serializePlan(plan) {
    return {
        id: plan.id,
        startedAt: plan.startedAt ? (plan.startedAt.getTime() / 1000) : null,
        endedAt: plan.endedAt ? (plan.endedAt.getTime() / 1000) : null,
        targetedOnTowns: plan.targetedOnTowns === true,
        name: plan.name,
        createdBy: plan.createdBy,
        updatedBy: plan.updatedBy,
        type: {
            id: plan.planTypeId,
            label: plan.planTypeLabel,
        },
        ngo: {
            id: plan.ngoId,
            name: plan.ngoName,
        },
        towns: [],
        details: null,
        departement: {
            id: plan.departementId,
            name: plan.departementName,
        },
    };
}

module.exports = (database) => {
    async function query(filters) {
        const filterParts = [];
        Object.keys(filters).forEach((column) => {
            filterParts.push(`plans.${column} IN (:${column})`);
        });

        const rows = await database.query(
            `SELECT
                plans.plan_id AS id,
                plans.name AS "name",
                plans.started_at AS "startedAt",
                plans.ended_at AS "endedAt",
                plans.targeted_on_towns AS "targetedOnTowns",
                plans.created_by AS "createdBy",
                plans.updated_by AS "updatedBy",
                ngos.ngo_id AS "ngoId",
                ngos.name AS "ngoName",
                plan_types.plan_type_id AS "planTypeId",
                plan_types.label AS "planTypeLabel",
                departements.code AS "departementCode",
                departements.name AS "departementName"
            FROM plans
            LEFT JOIN ngos ON plans.fk_ngo = ngos.ngo_id
            LEFT JOIN plan_types ON plans.fk_type = plan_types.plan_type_id
            LEFT JOIN departements ON plans.fk_departement = departements.code
            ${filterParts.length > 0 ? `WHERE ${filterParts.join(' OR ')}` : ''}`,
            {
                type: database.QueryTypes.SELECT,
                replacements: filters,
            },
        );

        const plansHash = {};
        const plans = rows.map((plan) => {
            const serializedPlan = serializePlan(plan);
            plansHash[plan.id] = serializedPlan;
            return serializedPlan;
        });

        if (plans.length > 0) {
            const planIds = rows.map(({ id: planId }) => planId);

            const details = await database.query(
                `SELECT
                    plan_details.fk_plan AS "planId",
                    plan_details.households_affected AS "householdsAffected",
                    plan_details.people_affected AS "peopleAffected",
                    plan_details.children_schoolable AS "childrenSchoolable",
                    plan_details.households_who_got_housing_with_help AS "householdsWhoGotHousingWithHelp",
                    plan_details.households_who_got_housing_without_help AS "householdsWhoGotHousingWithoutHelp",
                    plan_details.households_who_were_hosted AS "householdsWhoWereHosted",
                    plan_details.children_schooled AS "childrenSchooled",
                    plan_details.people_accessing_health AS "peopleAccessingHealth",
                    plan_details.people_helped_for_employment AS "peopleHelpedForEmployment",
                    plan_details.people_who_got_employment AS "peopleWhoGotEmployment",
                    plan_details.households_domiciled AS "householdsDomiciled",
                    plan_details.people_included AS "peopleIncluded",
                    plan_details.people_successfully_helped AS "peopleSuccessfullyHelped",
                    plan_details.people_excluded AS "peopleExcluded",
                    plan_details.people_who_resigned AS "peopleWhoResigned",
                    plan_details.people_pole_emploi AS "peoplePoleEmploi",
                    plan_details.people_mission_locale AS "peopleMissionLocale",
                    plan_details.people_with_bank_account AS "peopleWithBankAccount",
                    plan_details.people_trainee AS "peopleTrainee",
                    plan_details.average_duration AS "averageDuration",
                    plan_details.comment AS "comment",
                    plan_details.households AS "households",
                    plan_details.people AS "people",
                    plan_details.european_people AS "europeanPeople",
                    plan_details.french_people AS "frenchPeople",
                    plan_details.non_european_people AS "nonEuropeanPeople",
                    plan_details.young_kids AS "youngKids",
                    plan_details.other_kids AS "otherKids",
                    plan_details.schooled_kids AS "schooledKids",
                    plan_details.people_asking_for_cmu AS "peopleAskingForCmu",
                    plan_details.people_with_cmu AS "peopleWithCmu",
                    plan_details.minors_with_admin_procedure AS "minorsWithAdminProcedure",
                    plan_details.minors_with_justice_procedure AS "minorsWithJusticeProcedure",
                    shantytowns.shantytown_id AS "townId",
                    shantytowns.address
                FROM plan_details
                LEFT JOIN shantytowns ON plan_details.fk_shantytown = shantytowns.shantytown_id
                WHERE plan_details.fk_plan IN (:planIds)`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            );

            details.forEach((row) => {
                const rowDetails = {
                    householdsAffected: row.householdsAffected,
                    peopleAffected: row.peopleAffected,
                    childrenSchoolable: row.childrenSchoolable,
                    householdsWhoGotHousingWithHelp: row.householdsWhoGotHousingWithHelp,
                    householdsWhoGotHousingWithoutHelp: row.householdsWhoGotHousingWithoutHelp,
                    householdsWhoWereHosted: row.householdsWhoWereHosted,
                    childrenSchooled: row.childrenSchooled,
                    peopleAccessingHealth: row.peopleAccessingHealth,
                    peopleHelpedForEmployment: row.peopleHelpedForEmployment,
                    peopleWhoGotEmployment: row.peopleWhoGotEmployment,
                    householdsDomiciled: row.householdsDomiciled,
                    peopleIncluded: row.peopleIncluded,
                    peopleSuccessfullyHelped: row.peopleSuccessfullyHelped,
                    peopleExcluded: row.peopleExcluded,
                    peopleWhoResigned: row.peopleWhoResigned,
                    peoplePoleEmploi: row.peoplePoleEmploi,
                    peopleMissionLocale: row.peopleMissionLocale,
                    peopleWithBankAccount: row.peopleWithBankAccount,
                    peopleTrainee: row.peopleTrainee,
                    averageDuration: row.averageDuration,
                    comment: row.comment,
                    households: row.households,
                    people: row.people,
                    europeanPeople: row.europeanPeople,
                    frenchPeople: row.frenchPeople,
                    nonEuropeanPeople: row.nonEuropeanPeople,
                    youngKids: row.youngKids,
                    otherKids: row.otherKids,
                    schooledKids: row.schooledKids,
                    peopleAskingForCmu: row.peopleAskingForCmu,
                    peopleWithCmu: row.peopleWithCmu,
                    minorsWithAdminProcedure: row.minorsWithAdminProcedure,
                    minorsWithJusticeProcedure: row.minorsWithJusticeProcedure,
                };

                if (plansHash[row.planId].targetedOnTowns === true) {
                    if (row.townId === null) {
                        return;
                    }

                    plansHash[row.planId].towns.push(Object.assign({}, rowDetails, {
                        id: row.townId,
                        address: row.address,
                    }));
                } else {
                    if (row.townId !== null) {
                        return;
                    }

                    plansHash[row.planId].details = rowDetails;
                }
            });
        }

        return plans;
    }

    return {
        findAll: where => query(where),

        findOne: async (id) => {
            const rows = await query({
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
                        fk_ngo,
                        fk_type,
                        fk_departement,
                        created_by,
                        updated_by
                    )
                VALUES (
                    :name,
                    :startedAt,
                    :targeted,
                    :ngo,
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
                        ngo: data.ngo,
                        type: data.planType,
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

    };
};
