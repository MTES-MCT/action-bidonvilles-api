const accessRequestService = require('#server/services/accessRequest/accessRequestService');

module.exports = (agenda) => {
    agenda.define(
        'access_request_pending_1st',
        // accessRequestService.handlePendingAccessRequest.bind(this, true),
    );

    agenda.define(
        'access_request_pending_2nd',
        // accessRequestService.handlePendingAccessRequest.bind(this, false),
    );
};
