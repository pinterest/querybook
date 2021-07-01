import React from 'react';
import { Route, Switch, RouteComponentProps, Redirect } from 'react-router-dom';

import { DataDocWrapper } from 'components/DataDoc/DataDocWrapper';

import { FourOhFour } from 'ui/ErrorPage/FourOhFour';

const DataDocRoute: React.FunctionComponent<RouteComponentProps> = () => (
    <Switch>
        <Route path="/:env/datadoc/:docId/" component={DataDocWrapper} />
        <Route path="/:env/datadoc/" exact={true}>
            <Redirect to="/" />
        </Route>
        <Route component={FourOhFour} />
    </Switch>
);

export default DataDocRoute;
