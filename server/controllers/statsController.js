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
});
