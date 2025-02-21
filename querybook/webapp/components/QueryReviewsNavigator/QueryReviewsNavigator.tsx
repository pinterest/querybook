import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import {
    setActiveTab,
    initializeTabFromStorage,
    fetchReviews,
} from 'redux/queryReview/action';
import { IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';
import { QueryReviewItem } from './QueryReviewItem';
import { TooltipDirection } from 'const/tooltip';
import { Button } from 'ui/Button/Button';

import './QueryReviewsNavigator.scss';
import { ReviewType } from 'resource/queryReview';

const NAVIGATOR_TABS = [
    {
        key: ReviewType.CREATED,
        name: 'Created',
        icon: 'Clock' as const,
        tooltip: 'Reviews you have requested',
        tooltipPos: 'down' as TooltipDirection,
    },
    {
        key: ReviewType.ASSIGNED,
        name: 'Assigned',
        icon: 'ListOrdered' as const,
        tooltip: 'Reviews assigned to you',
        tooltipPos: 'down' as TooltipDirection,
    },
];

export const QueryReviewsNavigator: React.FC = () => {
    const [selectedReviewId, setSelectedReviewId] = useState<number>(null);

    const { reviews, isLoading, activeTab, page, hasMore } = useShallowSelector(
        (state: IStoreState) => {
            const tab = state.queryReview.activeTab;
            return {
                reviews:
                    tab === ReviewType.CREATED
                        ? state.queryReview.myReviews
                        : state.queryReview.assignedReviews,
                isLoading:
                    tab === ReviewType.CREATED
                        ? state.queryReview.loadingMyReviews
                        : state.queryReview.loadingAssignedReviews,
                activeTab: tab,
                page: state.queryReview.currentPage,
                hasMore: state.queryReview.hasMore,
            };
        }
    );

    const dispatch = useDispatch();

    // Load saved tab from localStorage
    useEffect(() => {
        dispatch(initializeTabFromStorage());
    }, []);

    useEffect(() => {
        dispatch(fetchReviews(activeTab));
    }, [activeTab, dispatch]);

    const handleTabChange = useCallback(
        (reviewType: ReviewType) => {
            dispatch(fetchReviews(reviewType, 0));
            dispatch(setActiveTab(reviewType));
        },
        [dispatch]
    );

    const handleLoadMore = useCallback(() => {
        const nextPage = page + 1;
        dispatch(fetchReviews(activeTab, nextPage));
    }, [activeTab, page, dispatch]);

    const loadingDOM = isLoading ? (
        <div className="flex-column m24">
            <Icon name="Loading" className="mb16" />
            <AccentText color="light" weight="bold">
                Loading Reviews...
            </AccentText>
        </div>
    ) : null;

    const noResultDOM =
        !isLoading && reviews.length === 0 ? (
            <div className="empty-section-message">
                No {activeTab === ReviewType.CREATED ? 'Requested' : 'Assigned'}{' '}
                Reviews
            </div>
        ) : null;

    const reviewListDOM = reviews.map((review) => (
        <QueryReviewItem
            key={review.id}
            review={review}
            type={activeTab}
            isSelected={review.id === selectedReviewId}
            onClick={() => setSelectedReviewId(review.id)}
        />
    ));

    const tabsDOM = (
        <div className="reviews-header">
            <Tabs
                items={NAVIGATOR_TABS}
                selectedTabKey={activeTab}
                onSelect={handleTabChange}
                pills
                size="small"
                className="list-header"
                align="center"
            />
        </div>
    );

    return (
        <div className="QueryReviewsNavigator SidebarNavigator">
            {tabsDOM}
            <div className="list-content scroll-wrapper">
                {isLoading && loadingDOM}
                {reviews.length > 0 && reviewListDOM}
                {!isLoading && hasMore && (
                    <div className="center-align mt16 mb16">
                        <Button onClick={handleLoadMore} title="Load More" />
                    </div>
                )}
                {noResultDOM}
            </div>
        </div>
    );
};
