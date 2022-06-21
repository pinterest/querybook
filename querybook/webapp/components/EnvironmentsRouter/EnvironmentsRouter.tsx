import { bind } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';
import {
    Redirect,
    Route,
    RouteComponentProps,
    Switch,
    withRouter,
} from 'react-router-dom';

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
import { fetchExporters } from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { FourOhThree } from 'ui/ErrorPage/FourOhThree';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';

type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type StateProps = ReturnType<typeof mapStateToProps>;
type IEnvironmentsRouterProps = DispatchProps &
    StateProps &
    RouteComponentProps;
interface IEnvironmentsRouterState {
    environmentsLoaded: boolean;
}

const blank: React.FunctionComponent = () => {
    const message =
        window.NO_ENVIRONMENT_MESSAGE ??
        `No Environment Available. Please contact ${getAppName()} Admin for more info.`;
    return <EmptyText>{message}</EmptyText>;
};

class EnvironmentsRouterComponent extends React.PureComponent<
    IEnvironmentsRouterProps,
    IEnvironmentsRouterState
> {
    public readonly state = {
        environmentsLoaded: false,
    };

    @bind
    public async loadEnvironments() {
        try {
            await this.props.fetchEnvironments();
        } finally {
            this.setState({
                environmentsLoaded: true,
            });
        }
    }

    @bind
    public loadInitialLoadItems() {
        // Load things that will only loaded once on start up here
        this.props.fetchExporters();
        this.props.fetchNotifiers();
    }

    @bind
    public loadEnvironment(name: string) {
        this.props.setEnvironment(name);
    }

    @bind
    public selectEnvironment(name: string) {
        const { environments, userEnvironmentNames, currentEnvironment } =
            this.props;
        if (userEnvironmentNames.has(name)) {
            for (const environment of environments) {
                if (
                    currentEnvironment !== environment &&
                    name === environment.name
                ) {
                    this.loadEnvironment(name);
                    break;
                }
            }
        }
    }

    public componentDidMount() {
        this.loadEnvironments();
        this.loadInitialLoadItems();
    }

    public render() {
        const { environmentsLoaded } = this.state;

        if (!environmentsLoaded) {
            return <Loading fullHeight />;
        }

        const {
            environments,
            currentEnvironment,
            userEnvironmentNames,
            defaultEnvironmentId,
            isAdmin,
        } = this.props;

        let redirectDOM = null;
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
                redirectDOM = (
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

        if (redirectDOM == null) {
            redirectDOM = (
                <Route
                    path="/"
                    exact={true}
                    component={isAdmin ? SetUp : blank}
                />
            );
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
                                selectEnvironment={this.selectEnvironment}
                                environment={currentEnvironment}
                            />
                        );
                    }}
                />
                {redirectDOM}
            </Switch>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        environments: environmentsSelector(state),
        currentEnvironment: currentEnvironmentSelector(state),
        userEnvironmentNames: userEnvironmentNamesSelector(state),
        defaultEnvironmentId:
            state.user.computedSettings['default_environment'],
        isAdmin: state.user.myUserInfo.isAdmin,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        fetchEnvironments: () =>
            dispatch(EnvironmentActions.fetchEnvironments()),
        setEnvironment: (name: string) =>
            dispatch(EnvironmentActions.setEnvironment(name)),
        fetchExporters: () => dispatch(fetchExporters()),
        fetchNotifiers: () => dispatch(fetchNotifiers()),
    };
}

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(EnvironmentsRouterComponent)
);
