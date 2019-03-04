const { expect } = require('chai');
const { signin } = require('#server/controllers/user');

describe('Test', () => {
    it('should always pass', () => {
        expect(signin).to.be.a('function');
    });
});
