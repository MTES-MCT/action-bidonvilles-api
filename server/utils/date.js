const MONTHS = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
];

module.exports = {
    toString(date) {
        return `${`${date.getDate()}`.padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    },
};
