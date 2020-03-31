import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { UnauthPage } from 'components/UnauthPage/UnauthPage';

import * as UserActions from 'redux/user/action';

import { IStoreState, Dispatch } from 'redux/store/types';
import { Loader } from 'ui/Loader/Loader';

export const UserLoader: React.FunctionComponent = ({ children }) => {
    const [showUnauthPage, setShowUnauth] = React.useState(false);
    const myUserInfo = useSelector(
        (state: IStoreState) => state.user.myUserInfo
    );
    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(UserActions.getUserSettingLocal());
    }, []);

    const fetchUserInfo = React.useCallback(() => {
        dispatch(UserActions.loginUser()).then(null, (e) => {
            setShowUnauth(true);
        });
    }, []);

    const handleSuccessLogin = React.useCallback(() => {
        setShowUnauth(false);
        fetchUserInfo();
    }, []);

    return showUnauthPage ? (
        <UnauthPage onSuccessLogin={handleSuccessLogin} />
    ) : (
        <Loader item={myUserInfo} itemLoader={fetchUserInfo}>
            {children}
        </Loader>
    );
};
