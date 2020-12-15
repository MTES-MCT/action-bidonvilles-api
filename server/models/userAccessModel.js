module.exports = database => ({
    async create({
        fk_user, sent_by, expires_at, created_at,
    }, transaction = undefined) {
        const result = await database.query(
            `INSERT INTO user_accesses(
                fk_user,
                sent_by,
                expires_at
                created_at
            ) VALUES (
                :fk_user,
                :sent_by,
                :expires_at,
                :created_at
            ) RETURNING user_access_id AS id`, {
                replacements: {
                    fk_user,
                    sent_by,
                    expires_at,
                    created_at,
                },
                transaction,
            },
        );

        return result[0][0].id;
    },

    update(user_access_id, { used_at }, transaction = undefined) {
        return database.query(
            `UPDATE user_accesses
            SET used_at = :used_at
            WHERE user_access_id = :user_access_id`,
            {
                replacements: {
                    user_access_id,
                    used_at,
                },
                transaction,
            },
        );
    },
});
