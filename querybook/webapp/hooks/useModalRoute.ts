import { Location } from 'history';
import { useSelector } from 'react-redux';

import { IStoreState } from 'redux/store/types';

export function useModalRoute(location: Location<{ isModal: boolean }>) {
    const disableModal = useSelector(
        (state: IStoreState) =>
            state.user.computedSettings.show_full_view === 'enabled'
    );
    return Boolean(!disableModal && location?.state?.isModal);
}
