const crypto = require('crypto');

function generate(email, password, fk_departement) {
    const salt = crypto.randomBytes(16).toString('hex');

    return {
        email,
        salt,
        password: crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex'),
        fk_departement,
        first_name: 'inconnu',
        last_name: 'inconnu',
        company: 'inconnu',
    };
}

module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'users',
        [
            generate('anis@beta.gouv.fr', 'fabnum', '78'),
            generate('clement.chapalain@beta.gouv.fr', 'fabnum', '75'),
            generate('sophie.jacquemont@developpement-durable.gouv.fr', 'fabnum', '75'),
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('users'),
};
