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
        announcements.filter(
            (a) => !(a.can_dismiss && dismissedIds.includes(a.id))
        )
);

export const dataDocNavBoardOpenSelector = (
    state: IStoreState,
    boardId: number
) => state.dataHubUI.dataDocNavigatorSectionOpen[`board-${boardId}`];
