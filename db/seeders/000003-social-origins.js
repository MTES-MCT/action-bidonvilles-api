module.exports = {
    up: queryInterface => queryInterface.bulkInsert(
        'social_origins',
        [
            { label: 'Ressortissants français' },
            { label: 'Ressortissants européens' },
            { label: 'Ressortissants extracommunautaires' },
        ],
    ),

    down: queryInterface => queryInterface.bulkDelete('social_origins'),
};
