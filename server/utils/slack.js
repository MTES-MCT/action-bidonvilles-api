const { IncomingWebhook } = require('@slack/webhook');
const { slack } = require('#server/config');
const { frontUrl } = require('#server/config');

const formatAddress = town => `${town.address} ${town.name ? `« ${town.name} » ` : ''}`;
const formatUsername = user => `${user.first_name} ${user.last_name} `;
const formatTownLink = (townID, text) => `<${frontUrl}/#/site/${townID}|${text}>`;

async function triggerShantytownCloseAlert(town, user) {
    const shantytownCloseAlert = new IncomingWebhook(slack.close_shantytown);

    const address = formatAddress(town);
    const username = formatUsername(user);
    const townLink = formatTownLink(town.id, address);

    const slackMessage = {
        text: `Fermeture de site ${address} par ${username}`,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `:rotating_light: Fermeture de site: ${townLink} par ${username}`,
                },
            },
        ],
        attachments: [
            {
                color: '#f2c744',
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Status* : ${town.closedWithSolutions ? 'Résorbé' : 'Disparu'}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Cause de la disparition* : ${town.status}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Nombre d'habitants* : ${town.populationTotal || 'Nombre inconnu'}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Date d'installation du site* : ${town.builtAt}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Date de signalement du site* : ${town.declaredAt}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Date de fermeture du site* : ${town.closedAt.slice(0, 10)}`,
                        },
                    },
                ],
            },
        ],


    };

    await shantytownCloseAlert.send(slackMessage);
}


async function triggerShantytownCreationAlert(town, user) {
    const shantytownCreationAlert = new IncomingWebhook(slack.new_shantytown);

    const address = formatAddress(town);
    const username = formatUsername(user);
    const townLink = formatTownLink(town.id, address);

    const slackMessage = {
        text: `Ouverture de site ${address} par ${username}`,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `:rotating_light: Ouverture de site: ${townLink} par ${username}`,
                },
            },
        ],
        attachments: [
            {
                color: '#f2c744',
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Nombre d'habitants* : ${town.populationTotal || 'Nombre inconnu'}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Date d'installation du site* : ${town.builtAt}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Date de signalement du site* : ${town.declaredAt}`,
                        },
                    },

                ],
            }],
    };

    await shantytownCreationAlert.send(slackMessage);
}

async function triggerNewUserAlert(user) {
    const newUserAlert = new IncomingWebhook(slack.new_user);

    const username = formatUsername(user);
    const usernameLink = `<${frontUrl}/#/nouvel-utilisateur/${user.id}|${username}>`;

    const { location } = user.organization;

    let locationText = 'Inconnu';
    if (location && location.type === 'nation') {
        locationText = 'National';
    } else if (location && location[location.type] !== null) {
        locationText = location[location.type].name;
    }

    const slackMessage = {
        text: `Nouvel utilisateur : ${username}`,
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `:rotating_light: Nouvel utilisateur : ${usernameLink} <${user.email}>`,
                },
            },
        ],
        attachments: [
            {
                color: '#f2c744',
                blocks: [
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `Territoire de rattachement: ${locationText}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `Organisation: ${user.organization.name}`,
                        },
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `Fonction: ${user.position}`,
                        },
                    },
                ],

            }],
    };

    await newUserAlert.send(slackMessage);
}

module.exports = {
    triggerShantytownCloseAlert,
    triggerShantytownCreationAlert,
    triggerNewUserAlert,
};
