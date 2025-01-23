import React from 'react';
import { useDispatch } from 'react-redux';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { TooltipDirection } from 'const/tooltip';
import { selectAssignedReviews } from 'redux/queryReview/selector';
import { fetchAssignedReviews } from 'redux/queryReview/action';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { IQueryReview } from 'const/queryExecution';

interface IQueryReviewButtonProps {
    tooltipPos?: TooltipDirection;
    onClick: () => void;
    active?: boolean;
}

function useAssignedReviews() {
    const { reviews } = useShallowSelector((state: IStoreState) => ({
        reviews: selectAssignedReviews(state),
    }));

    const pendingReviews = reviews.filter(
        (review: IQueryReview) => review.status === 'pending'
    );

    const dispatch = useDispatch();
    React.useEffect(() => {
        dispatch(fetchAssignedReviews());
    }, [dispatch]);

    return {
        pendingReviews,
    };
}

export const QueryReviewButton = React.memo<IQueryReviewButtonProps>(
    ({ tooltipPos = 'right', onClick, active }) => {
        const { pendingReviews } = useAssignedReviews();

        const buttonTitle = pendingReviews.length
            ? `You have ${pendingReviews.length} pending reviews`
            : 'No pending reviews';

        return (
            <span className="QueryReviewButton">
                <IconButton
                    onClick={onClick}
                    tooltip={buttonTitle}
                    tooltipPos={tooltipPos}
                    icon="Clipboard"
                    active={active}
                    ping={
                        pendingReviews.length > 0
                            ? pendingReviews.length.toString()
                            : null
                    }
                    title="Reviews"
                />
            </span>
        );
    }
);
