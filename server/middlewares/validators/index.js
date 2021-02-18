const createContact = require('./createContact');
const createTown = require('./createTown');
const createUser = require('./createUser');
const editTown = require('./editTown');
const addShantytownActor = require('./shantytownActors/addShantytownActor');
const updateShantytownActor = require('./shantytownActors/updateShantytownActor');
const removeShantytownActorTheme = require('./shantytownActors/removeShantytownActorTheme');

module.exports = {
    createContact,
    createTown,
    editTown,
    createUser,
    shantytownActors: {
        addShantytownActor,
        updateShantytownActor,
        removeShantytownActorTheme,
    },
};
