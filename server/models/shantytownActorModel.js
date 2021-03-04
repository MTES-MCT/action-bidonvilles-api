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

            // cas particulier du theme "autre"
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

/**
 * Takes a non-exhaustive array of themes, and returns an exhaustive one with the proper matching value
 *
 * - if a theme is not in the array: sets its value to false (or null for "autre")
 * - if a theme is in the array: keeps the provided value
 *
 * @param {Array} themes
 *
 * @returns {Object} A key-value object where the key is theme id
 */
function processThemes(themes) {
    return ACTOR_THEMES.reduce((acc, themeId) => {
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
    }, {});
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
            WHERE sa.fk_shantytown IN (:ids) AND u.fk_status = 'active'
            ORDER BY sa.fk_shantytown ASC, u.first_name ASC`,
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
        const replacements = {
            ...processThemes(themes),
            fk_shantytown: shantytownId,
            fk_user: userId,
            created_by: createdBy,
        };

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

    removeActor(shantytownId, userId, transaction = undefined) {
        return database.query(
            `DELETE
                FROM shantytown_actors
                WHERE fk_shantytown = :fk_shantytown AND fk_user = :fk_user`,
            {
                replacements: {
                    fk_shantytown: shantytownId,
                    fk_user: userId,
                },
                transaction,
            },
        );
    },

    updateThemes(shantytownId, userId, themes, updatedBy, transaction = undefined) {
        const replacements = {
            ...processThemes(themes),
            fk_shantytown: shantytownId,
            fk_user: userId,
            updated_by: updatedBy,
        };

        return database.query(
            `UPDATE shantytown_actors
                SET
                    sante = :sante,
                    education = :education,
                    emploi = :emploi,
                    logement = :logement,
                    mediation_sociale = :mediation_sociale,
                    securite = :securite,
                    humanitaire = :humanitaire,
                    diagnostic = :diagnostic,
                    pilotage = :pilotage,
                    autre = :autre,
                    updated_by = :updated_by
                WHERE fk_shantytown = :fk_shantytown AND fk_user = :fk_user`,
            {
                replacements,
                transaction,
            },
        );
    },

    removeTheme(shantytownId, userId, themeId, updatedBy, transaction = undefined) {
        return database.query(
            `UPDATE shantytown_actors
                SET
                    ${themeId} = :value,
                    updated_by = :updated_by
                WHERE fk_shantytown = :fk_shantytown AND fk_user = :fk_user`,
            {
                replacements: {
                    value: themeId === 'autre' ? null : false,
                    fk_shantytown: shantytownId,
                    fk_user: userId,
                    updated_by: updatedBy,
                },
                transaction,
            },
        );
    },
});
