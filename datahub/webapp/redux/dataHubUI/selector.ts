import { createSelector } from 'reselect';
import { IStoreState } from '../store/types';

const announcementsSelector = (state: IStoreState) =>
    state.dataHubUI.announcements;
const dismissedAnnouncementIdsSelector = (state: IStoreState) =>
    state.dataHubUI.dismissedAnnouncementIds;

export const visibleAnnouncementSelector = createSelector(
    announcementsSelector,
    dismissedAnnouncementIdsSelector,
    (announcements, dismissedIds) =>
        announcements.filter((a) => !dismissedIds.includes(a.id))
);
