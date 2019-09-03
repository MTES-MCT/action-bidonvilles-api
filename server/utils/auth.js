const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
    frontUrl, auth: authConfig, activationTokenExpiresIn, passwordResetDuration,
} = require('#server/config');

/**
 * Generates an access token for the given user
 *
 * @param {User}   user
 * @param {String} [type]
 * @param {string} [expiresIn]
 *
 * @returns {string}
 */
function generateAccessTokenFor(user, type = 'default', expiresIn = null) {
    return jwt.sign(
        {
            type,
            userId: user.id,
            email: user.email,
            activatedBy: user.activatedBy,
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

        const token = generateAccessTokenFor(user, 'account_validation', activationTokenExpiresIn);

        return {
            link: `${frontUrl}/activer-mon-compte/${encodeURIComponent(token)}`,
            expiracyDate: new Date(Date.now() + (parseInt(activationTokenExpiresIn, 10) * 60 * 60 * 1000)),
        };
    },

    /**
     * Generates a password-reset link
     *
     * @param {User} user
     *
     * @returns {String}
     */
    getPasswordResetLink(user) {
        if (!user) {
            throw new Error('The user is mandatory to generate a password-reset link');
        }

        const token = generateAccessTokenFor(user, 'password_reset', passwordResetDuration);

        return {
            link: `${frontUrl}/renouveler-mot-de-passe/${encodeURIComponent(token)}`,
            expiracyDate: new Date(Date.now() + (parseInt(passwordResetDuration, 10) * 60 * 60 * 1000)),
        };
    },
};
