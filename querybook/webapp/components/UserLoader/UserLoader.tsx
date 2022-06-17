import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UnauthPage } from 'components/UnauthPage/UnauthPage';
import { formatError } from 'lib/utils/error';
import { getEnvironment } from 'lib/utils/global';
import { Dispatch, IStoreState } from 'redux/store/types';
import * as UserActions from 'redux/user/action';
import { UserResource } from 'resource/user';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { Loader } from 'ui/Loader/Loader';

export const UserLoader: React.FunctionComponent = ({ children }) => {
    const [showUnauthPage, setShowUnauth] = React.useState(false);
    const [showSignup, setShowSignup] = React.useState(false);

    const [fetchError, setFetchError] = React.useState(null);

    const myUserInfo = useSelector(
        (state: IStoreState) => state.user.myUserInfo
    );
    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(UserActions.getUserSettingLocal());
    }, []);

    const fetchUserInfo = React.useCallback(async () => {
        try {
            await dispatch(UserActions.loginUser());
        } catch (e) {
            if (e?.response?.status === 401) {
                try {
                    const {
                        data: {
                            has_login: hasLogin,
                            has_signup: hasSignup,
                            oauth_url: oauthURL,
                        },
                    } = await UserResource.getLoginMethods();

                    if (getEnvironment() !== 'production' && oauthURL) {
                        window.location.href = oauthURL;
                    }
                    setShowSignup(hasSignup);
                    setShowUnauth(hasLogin);
                } catch (e2) {
                    setFetchError(e2);
                }
            } else {
                setFetchError(e);
            }
        }
    }, []);

    const handleSuccessLogin = React.useCallback(() => {
        setShowUnauth(false);
        fetchUserInfo();
    }, []);

    if (fetchError) {
        return (
            <ErrorPage
                errorTitle={'Unexpected Authentication Error'}
                errorMessage={formatError(fetchError)}
            />
        );
    }

    return showUnauthPage ? (
        <UnauthPage
            showSignUp={showSignup}
            onSuccessLogin={handleSuccessLogin}
        />
    ) : (
        <Loader item={myUserInfo} itemLoader={fetchUserInfo}>
            {children}
        </Loader>
    );
};
