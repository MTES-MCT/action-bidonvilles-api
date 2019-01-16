const url = require('url');
const { sequelize } = require('../../db/models');

function trim(str) {
    if (typeof str !== 'string') {
        return null;
    }

    return str.replace(/^\s*|\s*$/g, '');
}

function serializeOperator(operator) {
    return {
        id: parseInt(operator.operator_id, 10),
        name: operator.name,
    };
}

function serializeContact(contact) {
    return {
        id: parseInt(contact.contact_id, 10),
        name: contact.name,
        email: contact.email,
    };
}

module.exports = {
    async searchOperators(req, res) {
        const { query: { q } } = url.parse(req.url, true);

        const query = trim(q);
        if (query === null || query === '') {
            return res.status(400).send({
                error: {
                    developer_message: 'Empty or missing query',
                    user_message: 'La recherche ne peut pas être vide',
                },
            });
        }

        try {
            const results = await sequelize.query(`
                SELECT
                    operators.operator_id,
                    operators.name
                FROM
                    operators
                WHERE
                    REPLACE(operators.name, '-', ' ') ILIKE REPLACE(?, '-', ' ')
                ORDER BY
                    CASE
                        WHEN REPLACE(operators.name, '-', ' ') ILIKE REPLACE(?, '-', ' ') THEN 1
                        ELSE 2
                    END,
                    operators.name ASC
                LIMIT 10`,
            {
                replacements: [
                    `%${query}%`,
                    `${query}%`,
                ],
                type: sequelize.QueryTypes.SELECT,
            });

            return res.status(200).send(results.map(serializeOperator));
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: error.message,
                    user_message: 'Une erreur est survenue dans la lecture en base de données',
                },
            });
        }
    },

    async searchContacts(req, res) {
        const { query: { q } } = url.parse(req.url, true);

        const query = trim(q);
        if (query === null || query === '') {
            return res.status(400).send({
                error: {
                    developer_message: 'Empty or missing query',
                    user_message: 'La recherche ne peut pas être vide',
                },
            });
        }

        try {
            const results = await sequelize.query(`
                SELECT
                    contacts.contact_id,
                    contacts.name,
                    contacts.email
                FROM
                    contacts
                WHERE
                    REPLACE(contacts.name, '-', ' ') ILIKE REPLACE(?, '-', ' ')
                ORDER BY
                    CASE
                        WHEN REPLACE(contacts.name, '-', ' ') ILIKE REPLACE(?, '-', ' ') THEN 1
                        ELSE 2
                    END,
                    contacts.name ASC
                LIMIT 10`,
            {
                replacements: [
                    `%${query}%`,
                    `${query}%`,
                ],
                type: sequelize.QueryTypes.SELECT,
            });

            return res.status(200).send(results.map(serializeContact));
        } catch (error) {
            return res.status(500).send({
                error: {
                    developer_message: error.message,
                    user_message: 'Une erreur est survenue dans la lecture en base de données',
                },
            });
        }
    },
};
