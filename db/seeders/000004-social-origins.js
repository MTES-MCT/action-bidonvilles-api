module.exports = {
    up: (queryInterface) => {
        return queryInterface.bulkInsert(
            'social_origins',
            [
                { label: 'Ressortissants français' },
                { label: 'Ressortissants européens' },
                { label: 'Ressortissants extracommunautaires' },
            ],
        );
    },

    down: (queryInterface) => {
        return queryInterface.bulkDelete('social_origins');
    },
};
