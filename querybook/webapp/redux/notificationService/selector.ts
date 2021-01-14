import { IStoreState } from 'redux/store/types';

export const notificationServiceSelector = (state: IStoreState) =>
    state.notificationService.notificationServices;
