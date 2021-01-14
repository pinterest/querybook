import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';

// import { Querybook } from 'components/Querybook';
import { AppAdmin } from 'components/AppAdmin/AppAdmin';
import { UserLoader } from 'components/UserLoader/UserLoader';
import { EnvironmentsRouter } from 'components/EnvironmentsRouter/EnvironmentsRouter';

import history from 'lib/router-history';

import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { AppLayout } from 'components/AppLayout/AppLayout';

export const AppRouter: React.FunctionComponent = () => (
    <Router history={history}>
        <UserLoader>
            <AppLayout>
                <Switch>
                    <Route path="/admin/:entity?" component={AppAdmin} />
                    <Route
                        exact
                        path="/"
                        render={() => <EnvironmentsRouter />}
                    />
                    <Route path="/:env/" component={EnvironmentsRouter} />
                    <Route component={FourOhFour} />
                </Switch>
            </AppLayout>
        </UserLoader>
    </Router>
);
