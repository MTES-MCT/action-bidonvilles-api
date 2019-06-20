global.sandbox = sinon.createSandbox();

// express's request
global.req = {};

// express's response
global.res = {
    send: sandbox.stub(),
    status: sandbox.stub(),
};
global.sentData = null; // arguments passed to res.send()

// express's middleware callback
global.next = sandbox.stub();

// models
const models = require('#server/models')({});

global.fakeModels = Object.keys(models).reduce((acc, modelName) => Object.assign({}, acc, {
    [modelName]: sandbox.stub(models[modelName]),
}), {});

// database
global.fakeDb = {
    query: sinon.stub(),
    QueryTypes: {
        SELECT: 1,
    },
};
