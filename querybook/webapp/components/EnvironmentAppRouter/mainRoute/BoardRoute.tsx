import React from 'react';
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import { BoardWrapper } from 'components/Board/BoardWrapper';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';

const BoardRoute: React.FunctionComponent<RouteComponentProps> = () => (
    <Switch>
        <Route path="/:env/list/:boardId/" component={BoardWrapper} />
        <Route path="/:env/list/" exact={true}>
            <Redirect to="/" />
        </Route>
        <Route component={FourOhFour} />
    </Switch>
);

export default BoardRoute;
