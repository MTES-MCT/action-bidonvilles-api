const { expect } = require('chai');
const proxyquire = require('proxyquire');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const fakeAuthConfig = {
    secret: global.generate('string'),
    expiresIn: `${global.generate('number')}h`,
};
const { generateAccessTokenFor, hashPassword, generateSalt } = proxyquire('#server/utils/auth', {
    '#server/config': {
        auth: fakeAuthConfig,
    },
});

describe('[Utils] Auth', () => {
    describe('.generateAccessTokenFor()', () => {
        it('it should return a valid token for the given user', () => {
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
        it('it should return the properly hashed password', () => {
            const plainPassword = global.generate('string');
            const salt = global.generate('string');

            expect(hashPassword(plainPassword, salt)).to.be.eql(
                crypto.pbkdf2Sync(plainPassword, salt, 10000, 512, 'sha512').toString('hex'),
            );
        });
    });

    describe('.generateSalt()', () => {
        it('it should return a 32-characters long string', () => {
            const salt = generateSalt();
            expect(salt).to.be.a.string;
            expect(salt).to.have.lengthOf(32);
        });

        it('it should return a random string', () => {
            expect(generateSalt()).not.to.be.eql(generateSalt());
        });
    });
});