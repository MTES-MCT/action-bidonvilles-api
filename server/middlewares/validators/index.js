const createContact = require('./createContact');
const createTown = require('./createTown');
const createUser = require('./createUser');
const editTown = require('./editTown');
const addShantytownActor = require('./shantytownActors/addShantytownActor');
const updateShantytownActor = require('./shantytownActors/updateShantytownActor');
const removeShantytownActorTheme = require('./shantytownActors/removeShantytownActorTheme');
const inviteShantytownActor = require('./shantytownActors/inviteShantytownActor');

module.exports = {
    createContact,
    createTown,
    editTown,
    createUser,
    shantytownActors: {
        addShantytownActor,
        updateShantytownActor,
        removeShantytownActorTheme,
        inviteShantytownActor,
    },
};
