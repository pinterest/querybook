import React, { useCallback, useMemo, useRef, useState } from 'react';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { IQueryReview } from 'const/queryExecution';
import { Status } from 'const/queryStatus';
import history from 'lib/router-history';
import { generateFormattedDate } from 'lib/utils/datetime';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import './QueryReviewsNavigator.scss';

type ReviewType = 'myReviews' | 'assigned';

interface IQueryReviewItemProps {
    review: IQueryReview;
    type: ReviewType;
}

const STATUS_COLOR_MAP: Record<string, Status> = {
    pending: Status.warning,
    approved: Status.success,
    rejected: Status.error,
} as const;

const ReviewHeader: React.FC<{ review: IQueryReview; statusColor: Status }> = ({
    review,
    statusColor,
}) => (
    <div className="review-header horizontal-space-between mb4">
        <div className="flex-row">
            <StatusIcon status={statusColor} />
            <AccentText className="mr8" size="small" weight="bold">
                Execution {review.query_execution_id}
            </AccentText>
        </div>
        <Tag mini>
            {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
        </Tag>{' '}
    </div>
);

const AssignedReviewContent: React.FC<{ review: IQueryReview }> = ({
    review,
}) => (
    <>
        <div className="review-row">
            <span className="label">Requested By:</span>
            <UserBadge uid={review.requested_by} mini cardStyle />
        </div>
        <div className="review-row">
            <span className="label">Request Reason:</span>
            <span
                className="value text-ellipsis"
                aria-label={review.request_reason}
                data-balloon-pos="up"
            >
                <ShowMoreText text={review.request_reason} />
            </span>
        </div>
    </>
);

const MyReviewContent: React.FC<{ review: IQueryReview }> = ({ review }) => {
    const [showAllReviewers, setShowAllReviewers] = useState(false);
    const hasMoreReviewers = review.reviewer_ids.length > 3;
    const displayedReviewers = showAllReviewers
        ? review.reviewer_ids
        : review.reviewer_ids.slice(0, 3);

    return (
        <div className="review-row">
            <span className="label">Reviewers:</span>
            <div
                className="reviewers-list"
                aria-label={
                    !showAllReviewers && hasMoreReviewers
                        ? `${review.reviewer_ids.length} reviewers`
                        : undefined
                }
                data-balloon-pos="up"
            >
                {displayedReviewers.map((reviewerId) => (
                    <UserBadge
                        key={reviewerId}
                        uid={reviewerId}
                        mini
                        cardStyle
                    />
                ))}
                {hasMoreReviewers && (
                    <span
                        className="show-more-reviewers"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowAllReviewers(!showAllReviewers);
                        }}
                    >
                        {showAllReviewers
                            ? ' show less'
                            : ` +${review.reviewer_ids.length - 3} more`}
                    </span>
                )}
            </div>
        </div>
    );
};

const ReviewTimestamp: React.FC<{
    review: IQueryReview;
    type: ReviewType;
}> = ({ review, type }) => (
    <AccentText
        className="horizontal-space-between"
        size="xsmall"
        color="lightest"
    >
        <span>
            {type === 'assigned' ? 'Requested' : 'Created'} at:{' '}
            {generateFormattedDate(review.created_at)}
        </span>
    </AccentText>
);

export const QueryReviewItem: React.FC<IQueryReviewItemProps> = ({
    review,
    type,
}) => {
    const selfRef = useRef<HTMLDivElement>();

    const queryExecutionUrl = useMemo(
        () => `/query_execution/${review.query_execution_id}/`,
        [review.query_execution_id]
    );

    const handleClick = useCallback(() => {
        navigateWithinEnv(queryExecutionUrl);
    }, [queryExecutionUrl]);

    const statusColor: Status =
        STATUS_COLOR_MAP[review.status] ?? Status.warning;

    return (
        <>
            <div
                className="QueryReviewItem"
                onClick={handleClick}
                ref={selfRef}
            >
                <ReviewHeader review={review} statusColor={statusColor} />

                <div className="review-content mb4">
                    {type === 'assigned' ? (
                        <AssignedReviewContent review={review} />
                    ) : (
                        <MyReviewContent review={review} />
                    )}
                </div>

                <ReviewTimestamp review={review} type={type} />
            </div>
            <UrlContextMenu anchorRef={selfRef} url={queryExecutionUrl} />
        </>
    );
};
