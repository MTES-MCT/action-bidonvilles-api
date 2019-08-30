module.exports = {
    national_establisment: {
        description: 'TODO',
        national_permissions: [
            [{ type: 'view', label: 'Consulter les %sites%', comments: 'dont les procédures judiciaires' }],
            [{ type: 'view', label: 'Consulter les %dispositifs%', comments: 'dont les financements' }],
        ],
        local_permissions: [],
        options: [],
    },
    direct_collaborator: {
        description: 'TODO',
        national_permissions: [
            [{ type: 'view', label: 'Consulter les %sites%', comments: 'dont les procédures judiciaires' }],
            [{ type: 'view', label: 'Consulter les %dispositifs%', comments: 'hors financements' }],
        ],
        local_permissions: [
            [{ type: 'edit', label: 'Créer, mettre à jour les %sites%', comments: 'dont les procédures judiciaires' }],
            [{ type: 'edit', label: 'Mettre à jour les %dispositifs%', comments: 'dont les financements' }],
            [{ type: 'edit', label: 'Consulter et ajouter des %commentaires%', comments: null }],
        ],
        options: [],
    },
    collaborator: {
        description: 'TODO',
        national_permissions: [],
        local_permissions: [
            [
                { type: 'edit', label: 'Créer, mettre à jour les %sites%', comments: null },
                {
                    type: 'deny', label: 'hors fermeture des sites', comments: null, option: 'close_shantytown',
                },
                { type: 'view', label: 'Consulter les procédures judiciaires', comments: null },
            ],
            [{ type: 'edit', label: 'Mettre à jour les %dispositifs%', comments: 'hors financements' }],
        ],
        options: [
            { id: 'close_shantytown', label: 'Autoriser l’opérateur à créer un site et déclarer la fermeture d’un site' },
            { id: 'hide_justice', label: 'Masquer les procédures judiciaires' },
        ],
    },
    association: {
        description: 'TODO',
        national_permissions: [],
        local_permissions: [
            [
                { type: 'edit', label: 'Mettre à jour les %sites%', comments: null },
                {
                    type: 'deny', label: 'hors fermeture des sites', comments: null, option: 'create_and_close_shantytown',
                },
                {
                    type: 'deny', label: 'hors création des sites', comments: null, option: 'create_and_close_shantytown',
                },
                { type: 'view', label: 'Consulter les procédures judiciaires', comments: null },
            ],
            [{ type: 'view', label: 'Mettre à jour les %dispositifs%', comments: 'hors financements' }],
        ],
        options: [
            { id: 'create_and_close_shantytown', label: 'Autoriser l’opérateur à créer un site et déclarer la fermeture d’un site' },
            { id: 'hide_justice', label: 'Masquer les procédures judiciaires' },
        ],
    },
};
