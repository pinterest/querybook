import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { UnauthPage } from 'components/UnauthPage/UnauthPage';

import * as UserActions from 'redux/user/action';

import { IStoreState, Dispatch } from 'redux/store/types';
import { Loader } from 'ui/Loader/Loader';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { formatError } from 'lib/utils/error';
import { useGlobalState } from 'hooks/redux/useGlobalState';
import { Modal } from 'ui/Modal/Modal';
import { Title } from 'ui/Title/Title';

export const UserLoader: React.FunctionComponent = ({ children }) => {
    const [showUnauthPage, setShowUnauth] = React.useState(false);
    const [fetchError, setFetchError] = React.useState(null);
    const [sessionExpired] = useGlobalState('sessionExpired', false);

    const myUserInfo = useSelector(
        (state: IStoreState) => state.user.myUserInfo
    );
    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(UserActions.getUserSettingLocal());
    }, []);

    const refreshPage = useCallback(() => window.location.reload(), []);
    const fetchUserInfo = React.useCallback(() => {
        dispatch(UserActions.loginUser()).then(null, (e) => {
            if (e?.response?.status === 401) {
                setShowUnauth(true);
            } else {
                setFetchError(e);
            }
        });
    }, []);

    const handleSuccessLogin = React.useCallback(() => {
        setShowUnauth(false);
        fetchUserInfo();
    }, []);

    if (fetchError) {
        return (
            <ErrorPage errorTitle={'Unexpected Authentication Error'}>
                {formatError(fetchError)}
            </ErrorPage>
        );
    }

    let sessionExpiredDOM = null;
    if (sessionExpired) {
        sessionExpiredDOM = (
            <Modal
                onHide={() => {
                    /* Can't be hidden */
                }}
                hideClose={true}
            >
                <div
                    className="flex-center mv24"
                    onClick={refreshPage}
                    style={{ cursor: 'pointer' }}
                >
                    <Title size={5}>
                        Your session has expired. Click HERE to refresh the
                        page.
                    </Title>
                </div>
            </Modal>
        );
    }

    return showUnauthPage ? (
        <UnauthPage onSuccessLogin={handleSuccessLogin} />
    ) : (
        <Loader item={myUserInfo} itemLoader={fetchUserInfo}>
            {sessionExpiredDOM}
            {children}
        </Loader>
    );
};
