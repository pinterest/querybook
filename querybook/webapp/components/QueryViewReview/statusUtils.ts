import { Status } from 'const/queryStatus';

interface StatusProperties {
    status: Status;
    tooltip: string;
    tagClass: string;
    tagText: string;
}

export const getStatusProps = (
    isApproved: boolean,
    isRejected: boolean
): StatusProperties => {
    if (isApproved) {
        return {
            status: Status.success,
            tooltip: 'Query has been approved.',
            tagClass: 'Tag--success',
            tagText: 'APPROVED',
        };
    }

    if (isRejected) {
        return {
            status: Status.error,
            tooltip: 'Changes have been requested.',
            tagClass: 'Tag--error',
            tagText: 'CHANGES REQUESTED',
        };
    }

    return {
        status: Status.warning,
        tooltip: 'The query is pending review.',
        tagClass: 'Tag--warning',
        tagText: 'PENDING REVIEW',
    };
};
