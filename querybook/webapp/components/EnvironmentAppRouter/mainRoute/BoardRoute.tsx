import React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';

import { BoardWrapper } from 'components/Board/BoardWrapper';
import { PublicBoardPage } from 'components/PublicBoardPage/PublicBoardPage';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';

const BoardRoute: React.FunctionComponent<RouteComponentProps> = () => (
    <Switch>
        <Route path="/:env/list/:path" component={BoardWrapper} />
        <Route path="/:env/list/" exact={true}>
            <PublicBoardPage />
        </Route>
        <Route component={FourOhFour} />
    </Switch>
);

export default BoardRoute;
