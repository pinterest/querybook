import React from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';

import { usePrevious } from 'hooks/usePrevious';
import { useModalRoute } from 'hooks/useModalRoute';

import { AppDataDoc } from 'components/AppDataDoc/AppDataDoc';
import { Landing } from 'components/Landing/Landing';
import { QuerySnippetRoute } from 'components/QuerySnippetRoute/QuerySnippetRoute';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { QueryComposer } from 'components/QueryComposer/QueryComposer';
import { EmbeddedQueryPage } from 'components/EmbeddedQueryPage/EmbeddedQueryPage';

import { SearchRoute } from './SearchRoute';
import { DataTableRoute } from './DataTableRoute';
import { QueryExecutionRoute } from './QueryExecutionRoute';
import { UserSettingsMenuRoute } from './UserSettingsMenuRoute';

export const EnvironmentModalSwitchRouter: React.FC = () => {
    const location = useLocation();
    const history = useHistory();

    const lastLocation = usePrevious(location);
    const [lastNotModalLocation, setLastNotModalLocation] = React.useState(
        null
    );

    React.useEffect(() => {
        if (history.action !== 'POP' && !lastLocation?.state?.isModal) {
            setLastNotModalLocation(lastLocation);
        }
    }, [location]);

    const needsToShowModal =
        useModalRoute(location) && lastNotModalLocation !== location; // not initial render

    const modalRoutes = [
        <Route
            path="/:env/table/:id"
            key="table-route"
            component={DataTableRoute}
        />,
        <Route
            path="/:env/search/"
            key="search-route"
            component={SearchRoute}
        />,
        <Route
            key="snippet-route"
            path="/:env/query_snippet/:id/"
            component={QuerySnippetRoute}
        />,
        <Route
            key="execution-route"
            path="/:env/query_execution/:id/"
            component={QueryExecutionRoute}
        />,
        <Route
            key="settings-route"
            path="/:env/user_settings/"
            component={UserSettingsMenuRoute}
        />,
    ];

    const modalSwitch = needsToShowModal && <Switch>{modalRoutes}</Switch>;
    return (
        <>
            <Switch
                location={
                    // Show lastNotModalLocation when a modal route is presented
                    // In case we refresh the page (so lastNotModalLocation is null)
                    // We show the root which is the 404 Page. Null is not passed because
                    // Switch would use the current browser location instead
                    needsToShowModal
                        ? lastNotModalLocation ?? { pathname: '/' }
                        : location
                }
            >
                <Route path="/:env/" exact component={Landing} />
                <Route path="/:env/datadoc/" component={AppDataDoc} />
                <Route path="/:env/adhoc/" render={() => <QueryComposer />} />
                <Route
                    path="/:env/_/embedded_editor/"
                    render={() => <EmbeddedQueryPage />}
                />
                {modalRoutes}
                <Route component={FourOhFour} />
            </Switch>

            {modalSwitch}
        </>
    );
};
