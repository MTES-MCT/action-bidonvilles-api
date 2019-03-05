const { expect } = require('chai');
const proxyquire = require('proxyquire');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const fakeAuthConfig = {
    secret: global.generate('string'),
    expiresIn: `${global.generate('number')}h`,
};
const { generateAccessTokenFor, hashPassword } = proxyquire('#server/helpers/authHelper', {
    '#server/config': {
        auth: fakeAuthConfig,
    },
});

describe('server/helpers/authHelper', () => {
    describe('.generateAccessTokenFor()', () => {
        it('should return a valid token for the given user', () => {
            const fakeUser = {
                id: global.generate('number'),
                email: global.generate('string'),
            };

            expect(generateAccessTokenFor(fakeUser)).to.be.eql(
                jwt.sign(
                    {
                        userId: fakeUser.id,
                        email: fakeUser.email,
                    },
                    fakeAuthConfig.secret,
                    {
                        expiresIn: fakeAuthConfig.expiresIn,
                    },
                ),
            );
        });
    });

    describe('.hashPassword()', () => {
        it('should return the properly hashed password', () => {
            const plainPassword = global.generate('string');
            const salt = global.generate('string');

            expect(hashPassword(plainPassword, salt)).to.be.eql(
                crypto.pbkdf2Sync(plainPassword, salt, 10000, 512, 'sha512').toString('hex'),
            );
        });
    });
});