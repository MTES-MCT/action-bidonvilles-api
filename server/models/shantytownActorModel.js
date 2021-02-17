const ACTOR_THEMES = Object.keys(require('#server/config/shantytown_actor_themes'));

/**
 * Serializes a single actor row
 *
 * @param {Object} actor
 *
 * @returns {Object}
 */
function serializeActor(actor) {
    return {
        id: actor.userId,
        first_name: actor.userFirstName,
        last_name: actor.userLastName,
        organization: {
            id: actor.organizationId,
            name: actor.organizationAbbreviation || actor.organizationName,
        },
        themes: ACTOR_THEMES.reduce((arr, themeId) => {
            if (actor[themeId] === true) {
                return [...arr, { id: themeId }];
            }

            if (typeof actor[themeId] === 'string') {
                return [...arr, {
                    id: themeId,
                    value: actor[themeId],
                }];
            }

            return arr;
        }, []),
    };
}

module.exports = database => ({
    serializeActor,

    findAll(shantytownIds, transaction = undefined) {
        const ids = Array.isArray(shantytownIds) ? shantytownIds : [shantytownIds];

        return database.query(
            `SELECT
                sa.fk_shantytown AS "shantytownId",
                sa.sante,
                sa.education,
                sa.emploi,
                sa.logement,
                sa.mediation_sociale,
                sa.securite,
                sa.humanitaire,
                sa.diagnostic,
                sa.pilotage,
                sa.autre,
                u.user_id AS "userId",
                u.first_name AS "userFirstName",
                u.last_name AS "userLastName",
                o.organization_id AS "organizationId",
                o.name AS "organizationName",
                o.abbreviation AS "organizationAbbreviation"
            FROM
                shantytown_actors sa
            LEFT JOIN users u ON sa.fk_user = u.user_id
            LEFT JOIN organizations o ON u.fk_organization = o.organization_id
            WHERE sa.fk_shantytown IN (:ids) AND u.fk_status = 'active'`,
            {
                type: database.QueryTypes.SELECT,
                replacements: {
                    ids,
                },
                transaction,
            },
        );
    },

    addActor(shantytownId, userId, themes, createdBy, transaction = undefined) {
        const replacements = ACTOR_THEMES.reduce((acc, themeId) => {
            const obj = themes.find(({ id }) => id === themeId);
            if (themeId === 'autre') {
                return {
                    ...acc,
                    [themeId]: obj !== undefined ? obj.value : null,
                };
            }

            return {
                ...acc,
                [themeId]: obj !== undefined,
            };
        }, {
            fk_shantytown: shantytownId,
            fk_user: userId,
            created_by: createdBy,
        });

        return database.query(
            `INSERT INTO shantytown_actors
                (
                    fk_shantytown,
                    fk_user,
                    sante,
                    education,
                    emploi,
                    logement,
                    mediation_sociale,
                    securite,
                    humanitaire,
                    diagnostic,
                    pilotage,
                    autre,
                    created_by
                )
            VALUES (
                :fk_shantytown,
                :fk_user,
                :sante,
                :education,
                :emploi,
                :logement,
                :mediation_sociale,
                :securite,
                :humanitaire,
                :diagnostic,
                :pilotage,
                :autre,
                :created_by
            )`, {
                replacements,
                transaction,
            },
        );
    },
});
