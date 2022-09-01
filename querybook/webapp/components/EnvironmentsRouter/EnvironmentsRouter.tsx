import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import { EnvironmentAppRouter } from 'components/EnvironmentAppRouter/EnvironmentAppRouter';
import { SetUp } from 'components/SetUp/SetUp';
import { getAppName } from 'lib/utils/global';
import * as EnvironmentActions from 'redux/environment/action';
import {
    currentEnvironmentSelector,
    environmentsSelector,
    userEnvironmentNamesSelector,
} from 'redux/environment/selector';
import { fetchNotifiers } from 'redux/notificationService/action';
import { fetchQueryTranspilers } from 'redux/queryEngine/action';
import { fetchExporters } from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { FourOhThree } from 'ui/ErrorPage/FourOhThree';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';

const blank: React.FunctionComponent = () => {
    const message =
        window.NO_ENVIRONMENT_MESSAGE ??
        `No Environment Available. Please contact ${getAppName()} Admin for more info.`;
    return <EmptyText>{message}</EmptyText>;
};

const EnvironmentsRouter: React.FC = () => {
    const [environmentsLoaded, setEnvironmentLoaded] = useState(false);

    const dispatch: Dispatch = useDispatch();

    const environments = useSelector(environmentsSelector);
    const userEnvironmentNames = useSelector(userEnvironmentNamesSelector);
    const currentEnvironment = useSelector(currentEnvironmentSelector);
    const isAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );
    const defaultEnvironmentId = useSelector(
        (state: IStoreState) =>
            state.user.computedSettings['default_environment']
    );

    useEffect(() => {
        dispatch(EnvironmentActions.fetchEnvironments()).finally(() => {
            setEnvironmentLoaded(true);
        });
        dispatch(fetchQueryTranspilers());
        dispatch(fetchExporters());
        dispatch(fetchNotifiers());
    }, [dispatch]);

    const selectEnvironment = useCallback(
        (name: string) => {
            if (userEnvironmentNames.has(name)) {
                for (const environment of environments) {
                    if (
                        currentEnvironment !== environment &&
                        name === environment.name
                    ) {
                        dispatch(EnvironmentActions.setEnvironment(name));
                        break;
                    }
                }
            }
        },
        [dispatch, environments, currentEnvironment, userEnvironmentNames]
    );

    const getRedirectDOM = () => {
        if (userEnvironmentNames.size > 0) {
            let defaultEnvironment = null;
            if (defaultEnvironmentId != null) {
                defaultEnvironment = environments.find(
                    (env) =>
                        env.id === Number(defaultEnvironmentId) &&
                        userEnvironmentNames.has(env.name)
                );
            }

            if (!defaultEnvironment) {
                defaultEnvironment = environments.find((env) =>
                    userEnvironmentNames.has(env.name)
                );
            }
            if (defaultEnvironment) {
                return (
                    <Route
                        exact
                        path="/"
                        render={() => (
                            <Redirect to={`/${defaultEnvironment.name}/`} />
                        )}
                    />
                );
            }
        }

        return (
            <Route path="/" exact={true} component={isAdmin ? SetUp : blank} />
        );
    };

    if (!environmentsLoaded) {
        return <Loading fullHeight />;
    }

    return (
        <Switch>
            <Route
                path="/:env/"
                render={(props) => {
                    const envName = props.match.params['env'];
                    const isValid = !!environments.find(
                        (env) => env.name === envName
                    );
                    if (!isValid) {
                        return (
                            <FourOhFour>
                                Environment <code>{envName}</code> not found
                            </FourOhFour>
                        );
                    }

                    const canJoin = userEnvironmentNames.has(envName);
                    if (!canJoin) {
                        return (
                            <FourOhThree>
                                You have no access to environment{' '}
                                <code>{envName}</code>.
                            </FourOhThree>
                        );
                    }

                    return (
                        <EnvironmentAppRouter
                            {...props}
                            selectEnvironment={selectEnvironment}
                            environment={currentEnvironment}
                        />
                    );
                }}
            />
            {getRedirectDOM()}
        </Switch>
    );
};

export default EnvironmentsRouter;
