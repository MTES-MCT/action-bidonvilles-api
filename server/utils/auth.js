const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { frontUrl, auth: authConfig, activationTokenExpiresIn } = require('#server/config');

/**
 * Generates an access token for the given user
 *
 * @param {User}   user
 * @param {string} [expiresIn]
 *
 * @returns {string}
 */
function generateAccessTokenFor(user, expiresIn = null) {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
        },
        authConfig.secret,
        {
            expiresIn: expiresIn !== null ? expiresIn : authConfig.expiresIn,
        },
    );
}

module.exports = {
    generateAccessTokenFor,

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

    /**
     * Generates an account activation link
     *
     * @param {User} user
     *
     * @returns {string}
     */
    getAccountActivationLink(user) {
        if (!user) {
            throw new Error('The user is mandatory to generate an account activation link');
        }

        const token = generateAccessTokenFor(user, activationTokenExpiresIn);
        return `${frontUrl}/activer-mon-compte/${encodeURIComponent(token)}`;
    },
};
