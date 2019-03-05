const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { auth: authConfig } = require('#server/config');

module.exports = {
    /**
     * Generates an access token for the given user
     *
     * @param {User} user
     *
     * @returns {string}
     */
    generateAccessTokenFor(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            authConfig.secret,
            {
                expiresIn: authConfig.expiresIn,
            },
        );
    },

    /**
     * Hashes the given password
     *
     * @param {string} password The plain password
     * @param {string} salt     The salt to be used
     *
     * @returns {string}
     */
    hashPassword(password, salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
    },

    /**
     * Generates a random salt
     *
     * @returns {string}
     */
    generateSalt() {
        return crypto.randomBytes(16).toString('hex');
    },
};
