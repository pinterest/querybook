import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';

import { useModalRoute } from 'hooks/useModalRoute';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { Loading } from 'ui/Loading/Loading';
import { Modal } from 'ui/Modal/Modal';

// Main Routes
const Landing = React.lazy(() => import('components/Landing/Landing'));
const DataDocRoute = React.lazy(() => import('./mainRoute/DataDocRoute'));
const BoardRoute = React.lazy(() => import('./mainRoute/BoardRoute'));
const EmbeddedQueryPage = React.lazy(
    () => import('components/EmbeddedQueryPage/EmbeddedQueryPage')
);
const EmbeddedDataDocPage = React.lazy(
    () => import('components/EmbeddedDataDocPage/EmbeddedDataDocPage')
);
const QueryComposer = React.lazy(
    () => import('components/QueryComposer/QueryComposer')
);

const DataDocScheduleList = React.lazy(
    () => import('components/DataDocScheduleList/DataDocScheduleList')
);

// Modal Routes
const QuerySnippetRoute = React.lazy(
    () => import('components/QuerySnippetRoute/QuerySnippetRoute')
);
const ChangeLogRoute = React.lazy(() => import('./modalRoute/ChangeLogRoute'));
const DataTableRoute = React.lazy(() => import('./modalRoute/DataTableRoute'));
const InfoMenuRoute = React.lazy(() => import('./modalRoute/InfoMenuRoute'));
const QueryExecutionRoute = React.lazy(
    () => import('./modalRoute/QueryExecutionRoute')
);
const SearchRoute = React.lazy(() => import('./modalRoute/SearchRoute'));
const UserSettingsMenuRoute = React.lazy(
    () => import('./modalRoute/UserSettingsMenuRoute')
);

export const EnvironmentModalSwitchRouter: React.FC = () => {
    const location = useLocation();
    const [lastNotModalLocation, setLastNotModalLocation] =
        React.useState(null);

    React.useEffect(() => {
        if (!location?.state?.isModal) {
            setLastNotModalLocation(location);
        }
    }, [location]);

    const needsToShowModal =
        useModalRoute(location) && lastNotModalLocation !== location; // not initial render

    const modalRoutes = [
        <Route
            path="/:env/table/:id/"
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
        <Route
            key="log-route"
            path="/:env/changelog/:date?/"
            component={ChangeLogRoute}
        />,
        <Route
            key="info-route"
            path="/:env/info/:type/"
            component={InfoMenuRoute}
        />,
    ];

    const modalSwitch = needsToShowModal && (
        <React.Suspense
            fallback={
                <Modal onHide={() => null}>
                    <Loading fullHeight />
                </Modal>
            }
        >
            <Switch>{modalRoutes}</Switch>
        </React.Suspense>
    );

    return (
        <>
            <React.Suspense fallback={<Loading fullHeight />}>
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
                    <Route path="/:env/datadoc/" component={DataDocRoute} />
                    <Route path="/:env/list/" component={BoardRoute} />
                    <Route
                        path="/:env/adhoc/"
                        render={() => <QueryComposer />}
                    />
                    <Route
                        path="/:env/doc_schedules/"
                        render={() => <DataDocScheduleList />}
                    />
                    <Route
                        path="/:env/_/embedded_editor/"
                        render={() => <EmbeddedQueryPage />}
                    />
                    <Route
                        path="/:env/_/embedded_datadoc/:docId"
                        render={({ match }) => (
                            <EmbeddedDataDocPage id={match.params['docId']} />
                        )}
                    />
                    {modalRoutes}
                    <Route component={FourOhFour} />
                </Switch>
            </React.Suspense>
            {modalSwitch}
        </>
    );
};
