const { sequelize } = require('#db/models/index');
const userModel = require('#server/models/userModel')(sequelize);
const organizationModel = require('#server/models/organizationModel')(sequelize);
const organizationTypeModel = require('#server/models/organizationTypeModel')(sequelize);
const { generateSalt } = require('#server/utils/auth');

async function createUser(data) {
    const userId = await sequelize.transaction(async (t) => {
        // create association if necessary
        if (data.organization_category === 'association') {
            let create = null;
            let organization = null;
            if (data.association === 'Autre') {
                create = {
                    name: data.newAssociationName,
                    abbreviation: data.newAssociationAbbreviation || null,
                };
            } else {
                organization = await organizationModel.findOneAssociation(
                    data.association,
                    data.departement,
                );

                if (organization === null) {
                    const association = await organizationModel.findAssociationName(data.association);

                    create = {
                        name: association !== null ? association.name : data.association,
                        abbreviation: association !== null ? association.abbreviation : null,
                    };
                }
            }

            if (create !== null) {
                const type = (await organizationTypeModel.findByCategory('association'))[0].id;
                [[organization]] = (await organizationModel.create(
                    create.name,
                    create.abbreviation,
                    type,
                    null,
                    data.departement,
                    null,
                    null,
                    false,
                    t,
                ));
            }

            Object.assign(data, { organization: organization.id });
        }

        // create the user himself
        return userModel.create(Object.assign(data, {
            salt: generateSalt(),
        }), t);
    });

    return userModel.findOne(userId);
}

module.exports = createUser;
