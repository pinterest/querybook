import React, { useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import clsx from 'clsx';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { UserAvatarList } from 'components/UserBadge/UserAvatarList';
import { IQueryReview } from 'const/queryExecution';
import { generateFormattedDate } from 'lib/utils/datetime';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';
import { Icon } from 'ui/Icon/Icon';
import { IStoreState } from 'redux/store/types';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { capitalize } from 'lodash';
import { ReviewType } from 'resource/queryReview';

import './QueryReviewsNavigator.scss';

interface IQueryReviewItemProps {
    review: IQueryReview;
    type: ReviewType;
    isSelected?: boolean;
    onClick?: () => void;
}

const STATUS_ICON_MAP: Record<string, AllLucideIconNames> = {
    approved: 'Check',
    rejected: 'X',
    pending: 'Clock',
};

const ReviewHeader: React.FC<{ review: IQueryReview }> = ({ review }) => {
    return (
        <div className="review-header horizontal-space-between">
            {review.requested_by && (
                <span aria-label="Requested by" data-balloon-pos="up">
                    <UserBadge uid={review.requested_by} mini cardStyle />
                </span>
            )}
            <Tag mini light>
                <Icon
                    name={STATUS_ICON_MAP[review.status]}
                    size={12}
                    className="mr4"
                />
                {capitalize(review.status)}
            </Tag>
        </div>
    );
};

const ReviewContent: React.FC<{ review: IQueryReview }> = ({ review }) => {
    const isRejected = review.status === 'rejected';
    const title = isRejected ? 'Rejection Reason' : 'Request Reason';
    const reasonText = isRejected
        ? review.rejection_reason
        : review.request_reason;
    return (
        <div className="query-content-section">
            <AccentText className="content-label" size="small" weight="bold">
                {title}
            </AccentText>
            <div className="reason-text">
                <ShowMoreText
                    text={reasonText || 'No reason provided'}
                    length={50}
                    seeLess
                />
            </div>
        </div>
    );
};

interface MetaInfoProps {
    review: IQueryReview;
    userInfoById: IStoreState['user']['userInfoById'];
}

const MetaInfo: React.FC<MetaInfoProps> = ({ review, userInfoById }) => {
    const visibleReviewers = useMemo(
        () => review.reviewer_ids.slice(0, 3),
        [review.reviewer_ids]
    );
    const extraReviewers = Math.max(0, review.reviewer_ids.length - 3);

    return (
        <div className="meta-info">
            <div className="reviewers">
                <span aria-label="Reviewers" data-balloon-pos="up">
                    <Icon name="Users" size={14} className="mr4" />
                </span>
                <UserAvatarList
                    users={visibleReviewers.map((id) => {
                        const userInfo = userInfoById[id];
                        return {
                            uid: id,
                            tooltip: userInfo
                                ? userInfo.fullname ?? userInfo.username
                                : `User ${id}`,
                        };
                    })}
                    extraCount={extraReviewers}
                />
            </div>
            <div className="timestamp">
                <span aria-label="Updated at" data-balloon-pos="up">
                    <Icon name="Calendar" size={14} className="mr4" />
                    <AccentText size="xsmall" color="light">
                        {generateFormattedDate(review.created_at)}
                    </AccentText>
                </span>
            </div>
        </div>
    );
};

export const QueryReviewItem: React.FC<IQueryReviewItemProps> = ({
    review,
    isSelected,
    onClick,
}) => {
    const selfRef = useRef<HTMLDivElement>(null);
    const queryExecutionUrl = useMemo(
        () => `/query_execution/${review.query_execution_id}/`,
        [review.query_execution_id]
    );
    const handleClick = useCallback(() => {
        onClick?.();
        navigateWithinEnv(queryExecutionUrl);
    }, [queryExecutionUrl, onClick]);

    const className = clsx('QueryReviewItem', { 'is-selected': isSelected });
    const userInfoById = useSelector(
        (state: IStoreState) => state.user.userInfoById
    );

    return (
        <>
            <div className={className} onClick={handleClick} ref={selfRef}>
                <ReviewHeader review={review} />
                <ReviewContent review={review} />
                <MetaInfo review={review} userInfoById={userInfoById} />
            </div>
            <UrlContextMenu anchorRef={selfRef} url={queryExecutionUrl} />
        </>
    );
};
