const { Op: { or } } = require('sequelize');
const { Operator, Contact } = require('../../../db/models');

/**
 * Finds and sets the uid of every new operator from the given list
 *
 * For every operator in the given list that does not have a set "id" property:
 * - looks it up in the database
 * - set the "id" property with the found value
 *
 * Finally returns the same list as the given one, except that every operator would now
 * have a set "id".
 *
 * Obviously, this function works only if you created those operators in the database before.
 *
 * @param {Array.<Operator>} list
 *
 * @returns {Array.<Operator>}
 */
async function linkNewOperators(list) {
    // find all new operators, by name
    const newOperators = await Operator.findAll({
        where: {
            [or]: list
                .filter(operator => operator.id === undefined)
                .map(operator => ({ name: operator.name })),
        },
    });

    // link the new operators
    return list.map((operator) => {
        if (operator.id !== undefined) {
            return operator;
        }

        const newOperator = Object.assign({}, operator);
        newOperator.id = newOperators.find(o => o.name === newOperator.name).id;

        return newOperator;
    });
}

/**
 * Creates any new operator from the given list
 *
 * @param {Array.<Operator>} list
 *
 * @returns {Promise}
 */
function createNewOperators(list) {
    return Operator.bulkCreate(
        list.filter(operator => operator.id === undefined),
    );
}

/**
 * Finds and sets the uid of every new contact from the given list
 *
 * For every contact in the given list that does not have a set "id" property:
 * - looks it up in the database
 * - set the "id" property with the found value
 *
 * Finally returns the same list as the given one, except that every contact would now
 * have a set "id".
 *
 * Obviously, this function works only if you created those contacts in the database before.
 *
 * @param {Array.<Operator>} list
 *
 * @returns {Array.<Operator>}
 */
async function linkNewContacts(list) {
    // find all new contacts, by name
    const newContacts = await Contact.findAll({
        where: {
            [or]: list.reduce((contacts, operator) => ([...contacts, ...operator.contacts]), [])
                .filter(contact => contact.id === undefined)
                .map(contact => ({ email: contact.email })),
        },
    });

    // link the new contacts
    return list.map((operator) => {
        const newOperator = Object.assign({}, operator);
        newOperator.contacts = newOperator.contacts.map((contact) => {
            if (contact.id !== undefined) {
                return contact;
            }

            const newContact = Object.assign({}, contact);
            newContact.id = newContacts.find(c => c.email === newContact.email).id;

            return newContact;
        });

        return newOperator;
    });
}

/**
 * Creates any new contact from the given operator
 *
 * Ensures that every contact associated to the given operator already exists in database.
 * If not, creates it.
 *
 * @param {Operator} operator
 *
 * @returns {Promise}
 */
function createNewContacts(operator) {
    return Contact.bulkCreate(
        operator.contacts.filter(contact => contact.id === undefined).map(contact => Object.assign({ operator: operator.id }, contact)),
    );
}

/**
 * Creates any new operator and contacts from the given list
 *
 * Ensures that every operator in the given list already exists in database.
 * If not, creates it.
 *
 * It does the same for every contact of each operator.
 *
 * @param {Array.<Operator>} list
 *
 * @returns {Promise}
 */
module.exports = {
    async createOperatorsAndContacts(list) {
        // create the new operators
        await createNewOperators(list);
        const linkedList = await linkNewOperators(list);

        // create the new contacts
        await Promise.all(
            linkedList.map(async (operator) => {
                await createNewContacts(operator);
            }),
        );

        return linkNewContacts(linkedList);
    },
};

/**
 * @typedef {Object} Contact
 * @property {number} [id]    The uid of the contact, if it already exists in the database
 * @property {string} [name]  Name of the contact
 * @property {string} [email] Email of the contact
 */

/**
 * @typedef {Object} Operator
 * @property {number}          [id]     The uid of the operator, if it already exists in the database
 * @property {string}          [name]   The name of the operator
 * @property {Array.<Contact>} contacts Contacts related to that operator
 */
