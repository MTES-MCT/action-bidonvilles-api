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
    toString(date, showHours = false) {
        const str = `${`${date.getDate()}`.padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

        if (showHours !== true) {
            return str;
        }

        return `${str} à ${`${date.getHours()}`.padStart(2, '0')}h${`${date.getMinutes()}`.padStart(2, '0')}`;
    },
};
