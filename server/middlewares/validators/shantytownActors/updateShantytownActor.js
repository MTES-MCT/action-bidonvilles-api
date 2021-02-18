/* eslint-disable newline-per-chained-call */
const selfUserIdValidator = require('./utils/selfUserId');
const themesValidator = require('./utils/themes');

module.exports = [
    selfUserIdValidator,
    themesValidator,
];
