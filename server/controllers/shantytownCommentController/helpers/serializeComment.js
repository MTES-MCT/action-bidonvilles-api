module.exports = comment => Object.assign(
    {
        id: comment.commentId,
        description: comment.commentDescription,
        createdAt: comment.commentCreatedAt !== null ? (comment.commentCreatedAt.getTime() / 1000) : null,
        createdBy: {
            id: comment.commentCreatedBy,
            firstName: comment.userFirstName,
            lastName: comment.userLastName,
            position: comment.userPosition,
            organization: comment.organizationAbbreviation || comment.organizationName,
            organizationId: comment.organizationId,
        },
        private: comment.commentPrivate,
        shantytown: comment.shantytownId,
    },
    comment.covidCommentDate !== null
        ? {
            covid: {
                date: comment.covidCommentDate,
                information: comment.covidCommentInformation,
                distribution_de_kits: comment.covidCommentDistribution,
                cas_contacts: comment.covidCommentCasContacts,
                cas_suspects: comment.covidCommentCasSuspects,
                cas_averes: comment.covidCommentCasAveres,
            },
        }
        : {},
);
