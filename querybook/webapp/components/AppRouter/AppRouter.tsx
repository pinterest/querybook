import React from 'react';
import { Redirect, Route, Router, Switch } from 'react-router-dom';

import { AppLayout } from 'components/AppLayout/AppLayout';
import { ConfirmationManager } from 'components/ConfirmationManager/ConfirmationManager';
import { UserLoader } from 'components/UserLoader/UserLoader';
import history from 'lib/router-history';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { Loading } from 'ui/Loading/Loading';
import { ToastManager } from 'ui/ToastManager/ToastManager';

const AppAdmin = React.lazy(() => import('components/AppAdmin/AppAdmin'));
const EnvironmentsRouter = React.lazy(
    () => import('components/EnvironmentsRouter/EnvironmentsRouter')
);

export const AppRouter: React.FunctionComponent = () => (
    <Router history={history}>
        <UserLoader>
            <AppLayout>
                <React.Suspense fallback={<Loading fullHeight />}>
                    <Switch>
                        {/* auto append trailing slash */}
                        <Route
                            exact
                            strict
                            path="/:url*"
                            render={(props) => (
                                <Redirect
                                    to={{
                                        ...props.location,
                                        pathname: `${props.location.pathname}/`,
                                    }}
                                />
                            )}
                        />

                        <Route path="/admin/:entity?" component={AppAdmin} />
                        <Route
                            exact
                            path="/"
                            render={() => <EnvironmentsRouter />}
                        />
                        <Route path="/:env/" component={EnvironmentsRouter} />
                        <Route component={FourOhFour} />
                    </Switch>
                </React.Suspense>
            </AppLayout>
        </UserLoader>
        <ConfirmationManager />
        <ToastManager />
    </Router>
);
