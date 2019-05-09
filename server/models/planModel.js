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
        name: plan.name,
        householdsAffected: plan.householdsAffected,
        peopleAffected: plan.peopleAffected,
        childrenSchoolable: plan.childrenSchoolable,
        householdsWhoGotHousingWithHelp: plan.householdsWhoGotHousingWithHelp,
        householdsWhoGotHousingWithoutHelp: plan.householdsWhoGotHousingWithoutHelp,
        householdsWhoWereHosted: plan.householdsWhoWereHosted,
        childrenSchooled: plan.childrenSchooled,
        peopleAccessingHealth: plan.peopleAccessingHealth,
        peopleHelpedForEmployment: plan.peopleHelpedForEmployment,
        peopleWhoGotEmployment: plan.peopleWhoGotEmployment,
        householdsDomiciled: plan.householdsDomiciled,
        peopleIncluded: plan.peopleIncluded,
        peopleSuccessfullyHelped: plan.peopleSuccessfullyHelped,
        peopleExcluded: plan.peopleExcluded,
        peopleWhoResigned: plan.peopleWhoResigned,
        peoplePoleEmploi: plan.peoplePoleEmploi,
        peopleMissionLocale: plan.peopleMissionLocale,
        peopleWithBankAccount: plan.peopleWithBankAccount,
        peopleTrainee: plan.peopleTrainee,
        averageDuration: plan.averageDuration,
        comment: plan.comment,
        households: plan.households,
        people: plan.people,
        europeanPeople: plan.europeanPeople,
        frenchPeople: plan.frenchPeople,
        nonEuropeanPeople: plan.nonEuropeanPeople,
        youngKids: plan.youngKids,
        otherKids: plan.otherKids,
        schooledKids: plan.schooledKids,
        peopleAskingForCmu: plan.peopleAskingForCmu,
        peopleWithCmu: plan.peopleWithCmu,
        minorsWithAdminProcedure: plan.minorsWithAdminProcedure,
        minorsWithJusticeProcedure: plan.minorsWithJusticeProcedure,
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
        departement: {
            id: plan.departementId,
            name: plan.departementName,
        },
    };
}

module.exports = (database) => {
    async function query(id = null) {
        const rows = await database.query(
            `SELECT
                plans.plan_id AS id,
                plans.name AS "name",
                plans.started_at AS "startedAt",
                plans.ended_at AS "endedAt",
                plans.households_affected AS "householdsAffected",
                plans.people_affected AS "peopleAffected",
                plans.children_schoolable AS "childrenSchoolable",
                plans.households_who_got_housing_with_help AS "householdsWhoGotHousingWithHelp",
                plans.households_who_got_housing_without_help AS "householdsWhoGotHousingWithoutHelp",
                plans.households_who_were_hosted AS "householdsWhoWereHosted",
                plans.children_schooled AS "childrenSchooled",
                plans.people_accessing_health AS "peopleAccessingHealth",
                plans.people_helped_for_employment AS "peopleHelpedForEmployment",
                plans.people_who_got_employment AS "peopleWhoGotEmployment",
                plans.households_domiciled AS "householdsDomiciled",
                plans.people_included AS "peopleIncluded",
                plans.people_successfully_helped AS "peopleSuccessfullyHelped",
                plans.people_excluded AS "peopleExcluded",
                plans.people_who_resigned AS "peopleWhoResigned",
                plans.people_pole_emploi AS "peoplePoleEmploi",
                plans.people_mission_locale AS "peopleMissionLocale",
                plans.people_with_bank_account AS "peopleWithBankAccount",
                plans.people_trainee AS "peopleTrainee",
                plans.average_duration AS "averageDuration",
                plans.comment AS "comment",
                plans.households AS "households",
                plans.people AS "people",
                plans.european_people AS "europeanPeople",
                plans.french_people AS "frenchPeople",
                plans.non_european_people AS "nonEuropeanPeople",
                plans.young_kids AS "youngKids",
                plans.other_kids AS "otherKids",
                plans.schooled_kids AS "schooledKids",
                plans.people_asking_for_cmu AS "peopleAskingForCmu",
                plans.people_with_cmu AS "peopleWithCmu",
                plans.minors_with_admin_procedure AS "minorsWithAdminProcedure",
                plans.minors_with_justice_procedure AS "minorsWithJusticeProcedure",
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
            ${id !== null ? 'WHERE plan_id = :planId' : ''}`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    planId: id,
                },
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

            const towns = await database.query(
                `SELECT
                    plan_shantytowns.fk_plan AS "planId",
                    shantytowns.shantytown_id AS "townId",
                    shantytowns.address
                FROM plan_shantytowns
                LEFT JOIN shantytowns ON plan_shantytowns.fk_shantytown = shantytowns.shantytown_id
                WHERE plan_shantytowns.fk_plan IN (:planIds)`,
                {
                    type: database.QueryTypes.SELECT,
                    replacements: {
                        planIds,
                    },
                },
            );

            towns.forEach((town) => {
                plansHash[town.planId].towns.push({
                    id: town.townId,
                    address: town.address,
                });
            });
        }

        return plans;
    }

    return {
        findAll: () => query(),

        findOne: async (id) => {
            const rows = await query(id);
            if (rows.length === 1) {
                return rows[0];
            }

            return null;
        },

        create: async (data) => {
            const response = await database.query(
                `INSERT INTO
                    plans(
                        name,
                        started_at,
                        fk_ngo,
                        fk_type,
                        fk_departement,
                        households_affected,
                        people_affected,
                        children_schoolable,
                        households_who_got_housing_with_help,
                        households_who_got_housing_without_help,
                        households_who_were_hosted,
                        children_schooled,
                        people_accessing_health,
                        people_helped_for_employment,
                        people_who_got_employment,
                        households_domiciled,
                        people_included,
                        people_successfully_helped,
                        people_excluded,
                        people_who_resigned,
                        people_pole_emploi,
                        people_mission_locale,
                        people_with_bank_account,
                        people_trainee,
                        average_duration,
                        comment,
                        households,
                        people,
                        european_people,
                        french_people,
                        non_european_people,
                        young_kids,
                        other_kids,
                        schooled_kids,
                        people_asking_for_cmu,
                        people_with_cmu,
                        minors_with_admin_procedure,
                        minors_with_justice_procedure,
                        created_by,
                        updated_by
                    )
                VALUES (
                    :name,
                    :startedAt,
                    :ngo,
                    :type,
                    :departement,
                    :householdsAffected,
                    :peopleAffected,
                    :childrenSchoolable,
                    :householdsWhoGotHousingWithHelp,
                    :householdsWhoGotHousingWithoutHelp,
                    :householdsWhoWereHosted,
                    :childrenSchooled,
                    :peopleAccessingHealth,
                    :peopleHelpedForEmployment,
                    :peopleWhoGotEmployment,
                    :householdsDomiciled,
                    :peopleIncluded,
                    :peopleSuccessfullyHelped,
                    :peopleExcluded,
                    :peopleWhoResigned,
                    :peoplePoleEmploi,
                    :peopleMissionLocale,
                    :peopleWithBankAccount,
                    :peopleTrainee,
                    :averageDuration,
                    :comment,
                    :households,
                    :people,
                    :europeanPeople,
                    :frenchPeople,
                    :nonEuropeanPeople,
                    :youngKids,
                    :otherKids,
                    :schooledKids,
                    :peopleAskingForCmu,
                    :peopleWithCmu,
                    :minorsWithAdminProcedure,
                    :minorsWithJusticeProcedure,
                    :createdBy,
                    :updatedBy
                )
                RETURNING plan_id`,
                {
                    replacements: {
                        name: data.name || null,
                        startedAt: data.startedAt,
                        ngo: data.ngo,
                        type: data.planType,
                        departement: data.departement,
                        householdsAffected: data.households_affected || null,
                        peopleAffected: data.people_affected || null,
                        childrenSchoolable: data.children_schoolable || null,
                        householdsWhoGotHousingWithHelp: data.households_who_got_housing_with_help || null,
                        householdsWhoGotHousingWithoutHelp: data.households_who_got_housing_without_help || null,
                        householdsWhoWereHosted: data.households_who_were_hosted || null,
                        childrenSchooled: data.children_schooled || null,
                        peopleAccessingHealth: data.people_accessing_health || null,
                        peopleHelpedForEmployment: data.people_helped_for_employment || null,
                        peopleWhoGotEmployment: data.people_who_got_employment || null,
                        householdsDomiciled: data.households_domiciled || null,
                        peopleIncluded: data.people_included || null,
                        peopleSuccessfullyHelped: data.people_successfully_helped || null,
                        peopleExcluded: data.people_excluded || null,
                        peopleWhoResigned: data.people_who_resigned || null,
                        peoplePoleEmploi: data.people_pole_emploi || null,
                        peopleMissionLocale: data.people_mission_locale || null,
                        peopleWithBankAccount: data.people_with_bank_account || null,
                        peopleTrainee: data.people_trainee || null,
                        averageDuration: data.average_duration || null,
                        comment: data.comment || null,
                        households: data.households || null,
                        people: data.people || null,
                        europeanPeople: data.european_people || null,
                        frenchPeople: data.french_people || null,
                        nonEuropeanPeople: data.non_european_people || null,
                        youngKids: data.young_kids || null,
                        otherKids: data.other_kids || null,
                        schooledKids: data.schooled_kids || null,
                        peopleAskingForCmu: data.people_asking_for_cmu || null,
                        peopleWithCmu: data.people_with_cmu || null,
                        minorsWithAdminProcedure: data.minors_with_admin_procedure || null,
                        minorsWithJusticeProcedure: data.minors_with_justice_procedure || null,
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

            if (data.towns && data.towns.length) {
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
                    `INSERT INTO plan_shantytowns(
                        fk_plan, fk_shantytown, created_by, updated_by
                    )
                    VALUES (${replacements.join('),(')})`,
                    {
                        replacements: replacementValues,
                    },
                );
            }

            return planId;
        },

    };
};
