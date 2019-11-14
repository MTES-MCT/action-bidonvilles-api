const { Stats_Directory_Views } = require('#db/models');

module.exports = models => ({
    all: async (req, res) => {
        const [
            numberOfDepartements,
            numberOfActiveUsers,
            numberOfCollaboratorAndAssociationUsers,
            numberOfCollaboratorAndAssociationOrganizations,
            numberOfShantytownOperations,
            numberOfExports,
            numberOfComments,
            numberOfDirectoryViews,
            meanTimeBeforeCreationDeclaration,
            meanTimeBeforeClosingDeclaration,
            numberOfReviewedComments,
        ] = await Promise.all([
            models.stats.numberOfDepartements(),
            models.stats.numberOfActiveUsers(),
            models.stats.numberOfCollaboratorAndAssociationUsers(),
            models.stats.numberOfCollaboratorAndAssociationOrganizations(),
            models.stats.numberOfShantytownOperations(),
            models.stats.numberOfExports(),
            models.stats.numberOfComments(),
            models.stats.numberOfDirectoryViews(),
            models.stats.meanTimeBeforeCreationDeclaration(),
            models.stats.meanTimeBeforeClosingDeclaration(),
            models.stats.numberOfReviewedComments(),
        ]);

        return res.status(200).send({
            success: true,
            response: {
                statistics: {
                    numberOfDepartements,
                    numberOfActiveUsers,
                    numberOfCollaboratorAndAssociationUsers,
                    numberOfCollaboratorAndAssociationOrganizations,
                    numberOfShantytownOperations,
                    numberOfExports,
                    numberOfComments,
                    numberOfDirectoryViews,
                    meanTimeBeforeCreationDeclaration,
                    meanTimeBeforeClosingDeclaration,
                    numberOfReviewedComments,
                },
            },
        });
    },

    public: async (req, res) => {
        const [
            numberOfDepartements,
            numberOfActiveUsers,
            numberOfNewUsersLastMonth,
            numberOfCollaboratorAndAssociationUsers,
            numberOfCollaboratorAndAssociationOrganizations,
            numberOfShantytownOperations,
            numberOfExports,
            numberOfComments,
            numberOfDirectoryViews,
            meanTimeBeforeCreationDeclaration,
            meanTimeBeforeClosingDeclaration,
            numberOfReviewedComments,
        ] = await Promise.all([
            models.stats.numberOfDepartements(),
            models.stats.numberOfActiveUsers(),
            models.stats.numberOfNewUsersLastMonth(),
            models.stats.numberOfCollaboratorAndAssociationUsers(),
            models.stats.numberOfCollaboratorAndAssociationOrganizations(),
            models.stats.numberOfShantytownOperations(),
            models.stats.numberOfExports(),
            models.stats.numberOfComments(),
            models.stats.numberOfDirectoryViews(),
            models.stats.meanTimeBeforeCreationDeclaration(),
            models.stats.meanTimeBeforeClosingDeclaration(),
            models.stats.numberOfReviewedComments(),
        ]);

        return res.status(200).send({
            success: true,
            response: {
                statistics: {
                    numberOfDepartements,
                    numberOfActiveUsers,
                    numberOfNewUsersLastMonth,
                    numberOfCollaboratorAndAssociationUsers,
                    numberOfCollaboratorAndAssociationOrganizations,
                    numberOfShantytownOperations: Object.values(numberOfShantytownOperations)
                        .reduce((sum, rows) => sum + Object.values(rows).reduce((subtotal, { total }) => subtotal + parseInt(total, 10), 0), 0),
                    numberOfExports,
                    numberOfComments,
                    numberOfDirectoryViews,
                    meanTimeBeforeCreationDeclaration,
                    meanTimeBeforeClosingDeclaration,
                    numberOfReviewedComments,
                },
            },
        });
    },

    async directoryView(req, res) {
        const organizationId = parseInt(req.body.organization, 10);

        try {
            const organization = await models.organization.findOneById(organizationId);

            if (organization === null) {
                return res.status(400).send({
                    success: false,
                    response: {
                        error: {
                            user_message: 'La structure consultée n\'a pas été trouvéee en base de données',
                            developer_message: `Could not find the organization ${organizationId}`,
                        },
                    },
                });
            }
        } catch (error) {
            return res.status(500).send({
                success: false,
                response: {
                    error: {
                        user_message: 'Une erreur est survenue lors de la lecture en base de données',
                        developer_message: error.message,
                    },
                },
            });
        }

        try {
            await Stats_Directory_Views.create({
                organization: organizationId,
                viewed_by: req.user.id,
            });
        } catch (error) {
            return res.status(500).send({
                success: false,
                response: {
                    error: {
                        user_message: 'Une erreur est survenue lors de l\'écriture en base de données',
                        developer_message: error.message,
                    },
                },
            });
        }

        return res.status(201).send({});
    },
});
