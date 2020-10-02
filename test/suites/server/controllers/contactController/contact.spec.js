/* eslint-disable global-require */

/* **************************************************************************************************
 * TOOLS
 * *********************************************************************************************** */

const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const rewiremock = require('rewiremock/node');

const { expect } = require('chai');
const { mockRes } = require('sinon-express-mock');


function generateFakeUser() {
    return {
        id: global.generate('number'),
        email: global.generate('string'),
        departement: global.generate('string'),
        map_center: [global.generate('number'), global.generate('number')],
        first_name: global.generate('string'),
        last_name: global.generate('string'),
        company: global.generate('string'),
        permissions: {
            feature: [
                global.generate('string'),
                global.generate('string'),
            ],
            data: [
                global.generate('string'),
                global.generate('string'),
            ],
        },
        default_export: [
            global.generate('string'),
            global.generate('string'),
            global.generate('string'),
        ],
    };
}


/* **************************************************************************************************
 * FIXTURES
 * *********************************************************************************************** */


const emailStub = sinon.stub();


const mockModels = {
    '#server/utils/mail': {
        send: emailStub,
    },
};


const controllerMockModels = {
    user: {
        getNationalAdmins: sinon.stub(),
        findOne: sinon.stub(),
        getAdminsFor: sinon.stub(),
    },
};


/* **************************************************************************************************
 * TESTS
 * *********************************************************************************************** */

describe.only('contactController.contact()', () => {
    const req = {};
    let res;

    const user = generateFakeUser();

    const nationalAdmins = [
        generateFakeUser(),
        generateFakeUser(),
    ];

    const regionalAdmins = [
        generateFakeUser(),
        generateFakeUser(),
        generateFakeUser(),
    ];

    controllerMockModels.user.getNationalAdmins.resolves(nationalAdmins);
    controllerMockModels.user.findOne.resolves(user);
    controllerMockModels.user.getAdminsFor.resolves(regionalAdmins);

    beforeEach(() => {
        emailStub.reset();
    });

    describe('Success cases', () => {
        it('Should handle a simple message', async () => {
            const controller = rewiremock.proxy('#server/controllers/contactController', mockModels)(controllerMockModels);

            req.body = {
                access_request_message: 'ceci est un message',
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['help'],
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all national admins and ensure that it returns a 200
            expect(res.status).to.have.been.calledOnceWith(200);
            expect(emailStub).to.have.been.callCount(nationalAdmins.length);
        });

        it('Should should handle an access request for a non actor', async () => {
            const controller = rewiremock.proxy('#server/controllers/contactController', mockModels)(controllerMockModels);

            req.body = {
                access_request_message: 'ceci est un message',
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: false,
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all national admins and ensure that it returns a 200
            expect(res.status).to.have.been.calledOnceWith(200);
            expect(emailStub).to.have.been.callCount(nationalAdmins.length);
        });

        it('Should should handle an access request for a public_establishment', async () => {
            const createUserStub = sinon.stub();
            createUserStub.returns({});
            const controller = rewiremock.proxy('#server/controllers/contactController', {
                // Fake userService db models calls
                '#server/models/userModel': module.exports = () => ({
                    findOneByEmail: () => null,
                }),
                '#server/models/organizationCategoryModel': module.exports = () => ({
                    findOneById: () => 'something',
                }),
                '#server/models/organizationTypeModel': module.exports = () => ({
                    findOneById: () => ({ organization_category: 'public_establishment' }),
                }),
                '#server/models/organizationModel': module.exports = () => ({
                    findOneById: () => ({ fk_type: 12 }),
                }),
                '#server/services/createUser': module.exports = createUserStub,
            })(controllerMockModels);

            req.body = {
                access_request_message: "ceci est une demande d'acces",
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: true,
                organization_category: 'public_establishment',
                organization_public: '40765',
                organization_type: '12',
                position: 'test',
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all admins and ensure that it returns a 200
            expect(createUserStub).to.have.been.calledOnceWith({
                access_request_message: "ceci est une demande d'acces",
                created_by: null,
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                organization: undefined,
                organization_category: 'public_establishment',
                organization_public: 40765,
                organization_type: 12,
                position: 'test',
            });
            expect(res.status).to.have.been.calledOnceWith(200);
        });

        it('Should should handle an access request for a territorial_collectivity', async () => {
            const createUserStub = sinon.stub();
            createUserStub.returns({});
            const controller = rewiremock.proxy('#server/controllers/contactController', {
                // Fake userService db models calls
                '#server/models/userModel': module.exports = () => ({
                    findOneByEmail: () => null,
                }),
                '#server/models/organizationCategoryModel': module.exports = () => ({
                    findOneById: () => 'something',
                }),
                '#server/models/organizationModel': module.exports = () => ({
                    findOneById: () => ({ organization_category: 'territorial_collectivity' }),
                    findOneByLocation: () => ({ fk_category: 'territorial_collectivity' }),
                }),
                '#server/services/createUser': module.exports = createUserStub,
            })(controllerMockModels);

            req.body = {
                access_request_message: "ceci est une demande d'acces",
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: true,
                organization_category: 'territorial_collectivity',
                territorial_collectivity: {
                    category: 'Commune',
                    data: { code: '40101', type: 'city' },
                    code: '40101',
                    type: 'city',
                    id: '40101',
                    label: '(40) Gaas',
                },
                position: 'test',
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all admins and ensure that it returns a 200
            expect(createUserStub).to.have.been.calledOnceWith({
                access_request_message: "ceci est une demande d'acces",
                created_by: null,
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                organization: undefined,
                organization_category: 'territorial_collectivity',
                position: 'test',
                territorial_collectivity: {
                    category: 'Commune',
                    code: '40101',
                    data: { code: '40101', type: 'city' },
                    id: '40101',
                    label: '(40) Gaas',
                    type: 'city',
                },
            });
            expect(res.status).to.have.been.calledOnceWith(200);
        });

        it('Should should handle an access request for a administration', async () => {
            const createUserStub = sinon.stub();
            createUserStub.returns({});
            const controller = rewiremock.proxy('#server/controllers/contactController', {
                // Fake userService db models calls
                '#server/models/userModel': module.exports = () => ({
                    findOneByEmail: () => null,
                }),
                '#server/models/organizationCategoryModel': module.exports = () => ({
                    findOneById: () => 'something',
                }),
                '#server/models/organizationModel': module.exports = () => ({
                    findOneById: () => ({ fk_category: 'administration' }),
                }),
                '#server/services/createUser': module.exports = createUserStub,
            })(controllerMockModels);

            req.body = {
                access_request_message: "ceci est une demande d'acces",
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: true,
                organization_category: 'administration',
                organization_administration: '40752',
                position: 'rte',
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all admins and ensure that it returns a 200
            expect(res.status).to.have.been.calledOnceWith(200);
            expect(createUserStub).to.have.been.calledOnceWith({
                access_request_message: "ceci est une demande d'acces",
                created_by: null,
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                organization: undefined,
                organization_administration: 40752,
                organization_category: 'administration',
                position: 'rte',
            });
        });

        it('Should should handle an access request for an existing association', async () => {
            const createUserStub = sinon.stub();
            createUserStub.returns({});
            const controller = rewiremock.proxy('#server/controllers/contactController', {
                // Fake userService db models calls
                '#server/models/userModel': module.exports = () => ({
                    findOneByEmail: () => null,
                }),
                '#server/models/organizationCategoryModel': module.exports = () => ({
                    findOneById: () => 'something',
                }),
                '#server/models/organizationModel': module.exports = () => ({
                    findAssociationName: () => 'something',
                }),
                '#server/models/departementModel': module.exports = () => ({
                    findOne: () => 'something',
                }),
                '#server/services/createUser': module.exports = createUserStub,
            })(controllerMockModels);

            req.body = {
                access_request_message: "ceci est une demande d'acces",
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: true,
                organization_category: 'association',
                association: 'Accueuil coopération insertion pour les nouveaux arrivants',
                departement: '04',
                position: 'test',
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all admins and ensure that it returns a 200
            expect(res.status).to.have.been.calledOnceWith(200);
            expect(createUserStub).to.have.been.calledOnceWith({
                access_request_message: "ceci est une demande d'acces",
                association: 'Accueuil coopération insertion pour les nouveaux arrivants',
                created_by: null,
                departement: '04',
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                newAssociationAbbreviation: null,
                newAssociationName: null,
                organization_category: 'association',
                position: 'test',
            });
        });

        it('Should should handle an access request for a new association', async () => {
            const createUserStub = sinon.stub();
            createUserStub.returns({});
            const controller = rewiremock.proxy('#server/controllers/contactController', {
                // Fake userService db models calls
                '#server/models/userModel': module.exports = () => ({
                    findOneByEmail: () => null,
                }),
                '#server/models/organizationCategoryModel': module.exports = () => ({
                    findOneById: () => 'something',
                }),
                '#server/models/organizationModel': module.exports = () => ({
                    findAssociationName: () => null,
                }),
                '#server/models/departementModel': module.exports = () => ({
                    findOne: () => 'something',
                }),
                '#server/services/createUser': module.exports = createUserStub,
            })(controllerMockModels);

            req.body = {
                access_request_message: "ceci est une demande d'acces",
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                request_type: ['access-request'],
                is_actor: true,
                organization_category: 'association',
                association: 'Autre',
                newAssociationName: 'Nouvelle asso',
                newAssociationAbbreviation: 'Nouvelle asso abbreviation',
                departement: '04',
                position: 'test',
            };
            res = mockRes();

            await controller.contact(req, res);

            // It should send a message to all admins and ensure that it returns a 200
            expect(res.status).to.have.been.calledOnceWith(200);
            expect(createUserStub).to.have.been.calledOnceWith({
                access_request_message: "ceci est une demande d'acces",
                association: 'Autre',
                created_by: null,
                departement: '04',
                email: 'gael.destrem@gmail.com',
                first_name: 'gael',
                last_name: 'destrem',
                legal: true,
                newAssociationName: 'Nouvelle asso',
                newAssociationAbbreviation: 'Nouvelle asso abbreviation',
                organization_category: 'association',
                position: 'test',
            });
        });
    });
});
