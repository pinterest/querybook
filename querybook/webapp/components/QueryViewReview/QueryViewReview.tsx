import React, { useState, useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import { AccentText } from 'ui/StyledText/StyledText';
import { Card } from 'ui/Card/Card';
import { Button } from 'ui/Button/Button';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Tag } from 'ui/Tag/Tag';
import { Message } from 'ui/Message/Message';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { Modal } from 'ui/Modal/Modal';

import { IQueryExecution, IQueryReview } from 'const/queryExecution';
import { Status } from 'const/queryStatus';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { getStatusProps } from './statusUtils';
import { generateFormattedDate } from 'lib/utils/datetime';
import { ConfirmationMessage } from 'components/ConfirmationManager/ConfirmationMessage';
import { Icon } from 'ui/Icon/Icon';

import './QueryViewReview.scss';
import { QueryReviewState } from 'hooks/useQueryReview';
import { usePeerReview } from 'lib/peer-review/config';

const rejectSchema = Yup.object().shape({
    rejectionReason: Yup.string()
        .required('Please provide a reason for rejecting this query')
        .min(10, 'Rejection reason must be at least 10 characters'),
});

const ReviewHeader: React.FC<{
    status: Status;
    tooltip: string;
    label: string;
    tagClass: string;
    tagText: string;
}> = memo(({ status, tooltip, label, tagClass, tagText }) => (
    <div className="review-header">
        <div className="header-left">
            <StatusIcon status={status} tooltip={tooltip} />
            <AccentText weight="bold" className="header-label">
                {label}
            </AccentText>
        </div>
        <Tag
            className={tagClass}
            tooltip={tooltip}
            tooltipPos="up"
            color={
                status === Status.success
                    ? 'green'
                    : status === Status.error
                    ? 'red'
                    : 'yellow'
            }
            withBorder
        >
            {tagText}
        </Tag>
    </div>
));

const ReviewContent: React.FC<{
    review: IQueryReview;
}> = memo(({ review }) => (
    <div className="review-content">
        <div className="details-grid">
            <div className="detail-item">
                <AccentText color="light" size="small">
                    Requested By
                </AccentText>
                <UserBadge uid={review.requested_by} mini cardStyle />
            </div>
            <div className="detail-item">
                <AccentText color="light" size="small">
                    Reason Provided by Author
                </AccentText>
                <AccentText className="request-reason">
                    {review.request_reason || 'No reason provided'}
                </AccentText>
            </div>
            <div className="detail-item">
                <AccentText color="light" size="small">
                    Review Requested At
                </AccentText>
                <AccentText className="request-reason">
                    {generateFormattedDate(review.created_at)}
                </AccentText>
            </div>
        </div>
    </div>
));

const ReviewActions: React.FC<{
    showRejectForm: boolean;
    onShowRejectForm: (show: boolean) => void;
    onApprove: () => void;
    onReject: (values: { rejectionReason: string }) => void;
}> = memo(({ showRejectForm, onShowRejectForm, onApprove, onReject }) => {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const { reviewerTexts } = usePeerReview();

    return (
        <div className="review-actions">
            <div className="action-buttons">
                <Button
                    title="Reject Query"
                    color="cancel"
                    onClick={() => onShowRejectForm(true)}
                />
                <Button
                    title="Approve Query"
                    color="confirm"
                    onClick={() => setShowApproveModal(true)}
                />
            </div>

            {showApproveModal && (
                <ConfirmationMessage
                    header="Confirm Query Approval"
                    message={
                        <div className="approve-message">
                            {reviewerTexts.approveMessage}
                        </div>
                    }
                    onConfirm={onApprove}
                    onDismiss={() => setShowApproveModal(false)}
                    onHide={() => setShowApproveModal(false)}
                    confirmText="Approve"
                    cancelText="Cancel"
                    confirmColor="confirm"
                    cancelColor="cancel"
                    confirmIcon="Check"
                    cancelIcon="X"
                />
            )}

            {showRejectForm && (
                <Modal
                    title="Reject Query"
                    onHide={() => onShowRejectForm(false)}
                >
                    <div className="reject-form-container">
                        <Formik
                            initialValues={{ rejectionReason: '' }}
                            validationSchema={rejectSchema}
                            onSubmit={onReject}
                        >
                            {({ submitForm }) => (
                                <Form className="reject-form">
                                    <SimpleField
                                        name="rejectionReason"
                                        label="Reason for Rejection"
                                        help="Author must submit a new query review after addressing the rejection feedback."
                                        type="textarea"
                                        required
                                    />
                                    <div className="form-buttons">
                                        <Button
                                            title="Cancel"
                                            onClick={() =>
                                                onShowRejectForm(false)
                                            }
                                            className="mr8"
                                            icon="X"
                                            color="cancel"
                                        />
                                        <Button
                                            title="Submit Rejection"
                                            color="cancel"
                                            onClick={submitForm}
                                            icon="Send"
                                        />
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </Modal>
            )}
        </div>
    );
});

const ReviewStatus: React.FC<{
    isReviewer: boolean;
    isPending: boolean;
    isApproved: boolean;
    isRejected: boolean;
    queryReview: IQueryReview;
    showRejectForm: boolean;
    onShowRejectForm: (show: boolean) => void;
    onApprove: () => void;
    onReject: (values: { rejectionReason: string }) => void;
}> = memo(
    ({
        isReviewer,
        isPending,
        isApproved,
        isRejected,
        queryReview,
        showRejectForm,
        onShowRejectForm,
        onApprove,
        onReject,
    }) => {
        if (!isReviewer && isPending) {
            return (
                <Message
                    className="review-notifier"
                    type="info"
                    title="Review in Progress"
                >
                    This execution is currently under review. No further actions
                    are required.
                </Message>
            );
        }

        if (isReviewer && isPending) {
            return (
                <ReviewActions
                    showRejectForm={showRejectForm}
                    onShowRejectForm={onShowRejectForm}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            );
        }

        if (isApproved) {
            return (
                <Message
                    className="outcome-msg"
                    type="success"
                    title={
                        <div className="approval-title">
                            <Icon name="Check" size={20} />
                            <span>Review Approved</span>
                        </div>
                    }
                >
                    <div className="approval-details">
                        <div className="approval-content">
                            <AccentText className="approval-status">
                                This query has been approved and will be
                                executed.
                            </AccentText>
                            <AccentText
                                color="light"
                                size="small"
                                className="approval-note"
                            >
                                Note: If the query fails during execution due to
                                syntax errors or other issues, you will need to
                                submit a new review request with the corrected
                                query.
                            </AccentText>
                        </div>
                    </div>
                </Message>
            );
        }

        if (isRejected) {
            return (
                <Message
                    className="outcome-msg"
                    type="error"
                    title={
                        <div className="rejection-title">
                            <Icon name="AlertCircle" size={20} />
                            <span>Query Rejected</span>
                        </div>
                    }
                >
                    <div className="rejection-details">
                        <div className="rejection-header">
                            <div className="reviewer-info">
                                <UserBadge uid={queryReview.reviewed_by} />
                                <AccentText>
                                    has reviewed and rejected this query
                                </AccentText>
                            </div>
                        </div>
                        <div className="rejection-content">
                            <AccentText color="light" weight="bold">
                                Rejection Reason:
                            </AccentText>
                            <AccentText className="rejection-reason">
                                {queryReview.rejection_reason}
                            </AccentText>
                            <AccentText
                                color="light"
                                size="small"
                                className="rejection-note"
                            >
                                Note: A new query review will need to be
                                submitted after addressing these changes.
                            </AccentText>
                        </div>
                    </div>
                </Message>
            );
        }

        return null;
    }
);

export const QueryViewReview: React.FC<{
    queryExecution: IQueryExecution;
    queryReviewState: QueryReviewState;
}> = memo(({ queryExecution, queryReviewState }) => {
    const dispatch = useDispatch();
    const {
        permissions: { isReviewer },
        status: { isPending, isRejected, isApproved },
        review: queryReview,
    } = queryReviewState;

    const [showRejectForm, setShowRejectForm] = useState(false);

    const handleApprove = useCallback(async () => {
        try {
            await dispatch(
                queryExecutionsActions.approveQueryReview(queryExecution.id)
            );
            toast.success('Query approved successfully.');
        } catch {
            toast.error('Failed to approve the query.');
        }
    }, [dispatch, queryExecution.id]);

    const handleReject = useCallback(
        async (values: { rejectionReason: string }) => {
            try {
                await dispatch(
                    queryExecutionsActions.rejectQueryReview(
                        queryExecution.id,
                        values.rejectionReason.trim()
                    )
                );
                toast.success('Query rejected successfully.');
            } catch {
                toast.error('Failed to reject query.');
            }
        },
        [dispatch, queryExecution.id]
    );

    if (!queryReview) {
        return null;
    }

    const { status, tooltip, tagClass, tagText } = getStatusProps(
        isApproved,
        isRejected
    );

    return (
        <Card
            className="QueryViewReview"
            flexRow={false}
            alignLeft={true}
            width="100%"
        >
            <ReviewHeader
                status={status}
                tooltip={tooltip}
                label="Query Review"
                tagClass={tagClass}
                tagText={tagText}
            />

            <ReviewContent review={queryReview} />

            <ReviewStatus
                isReviewer={isReviewer}
                isPending={isPending}
                isApproved={isApproved}
                isRejected={isRejected}
                queryReview={queryReview}
                showRejectForm={showRejectForm}
                onShowRejectForm={setShowRejectForm}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </Card>
    );
});
