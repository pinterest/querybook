import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import {
    fetchAssignedReviews,
    fetchMyReviews,
    setActiveTab,
    initializeTabFromStorage,
} from 'redux/queryReview/action';
import {
    selectAssignedReviews,
    selectLoadingAssignedReviews,
    selectLoadingMyReviews,
    selectMyReviews,
    selectMyReviewsPage,
    selectAssignedReviewsPage,
    selectMyReviewsHasMore,
    selectAssignedReviewsHasMore,
} from 'redux/queryReview/selector';
import { IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';
import { QueryReviewItem } from './QueryReviewItem';
import { TooltipDirection } from 'const/tooltip';
import { Button } from 'ui/Button/Button';

import './QueryReviewsNavigator.scss';

type TabType = 'myReviews' | 'assigned';

const NAVIGATOR_TABS = [
    {
        key: 'myReviews' as TabType,
        name: 'Created',
        icon: 'Clock' as const,
        tooltip: 'Reviews you have requested',
        tooltipPos: 'down' as TooltipDirection,
    },
    {
        key: 'assigned' as TabType,
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
                    tab === 'myReviews'
                        ? selectMyReviews(state)
                        : selectAssignedReviews(state),
                isLoading:
                    tab === 'myReviews'
                        ? selectLoadingMyReviews(state)
                        : selectLoadingAssignedReviews(state),
                activeTab: tab,
                page:
                    tab === 'myReviews'
                        ? selectMyReviewsPage(state)
                        : selectAssignedReviewsPage(state),
                hasMore:
                    tab === 'myReviews'
                        ? selectMyReviewsHasMore(state)
                        : selectAssignedReviewsHasMore(state),
            };
        }
    );

    const dispatch = useDispatch();

    // Load saved tab from localStorage
    useEffect(() => {
        dispatch(initializeTabFromStorage());
    }, []);

    useEffect(() => {
        if (activeTab === 'myReviews') {
            dispatch(fetchMyReviews());
        } else {
            dispatch(fetchAssignedReviews());
        }
    }, [activeTab, dispatch]);

    const handleTabChange = useCallback(
        (key: string) => {
            if (key === 'myReviews' || key === 'assigned') {
                // Reset to page 0 when switching tabs
                if (key === 'myReviews') {
                    dispatch(fetchMyReviews(0));
                } else {
                    dispatch(fetchAssignedReviews(0));
                }
                dispatch(setActiveTab(key as TabType));
            }
        },
        [dispatch]
    );

    const handleLoadMore = useCallback(() => {
        const nextPage = page + 1;
        if (activeTab === 'myReviews') {
            dispatch(fetchMyReviews(nextPage));
        } else {
            dispatch(fetchAssignedReviews(nextPage));
        }
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
                No {activeTab === 'myReviews' ? 'Requested' : 'Assigned'}{' '}
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
