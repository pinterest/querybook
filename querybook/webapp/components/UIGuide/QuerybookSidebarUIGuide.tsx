import React from 'react';
import { useLocation } from 'react-router-dom';
import Tour, { ReactourStep } from 'reactour';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { getAppName } from 'lib/utils/global';
import { getQueryString } from 'lib/utils/query-string';
import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Link } from 'ui/Link/Link';
import { Title } from 'ui/Title/Title';

function getQuerybookSidebarTourSteps() {
    const hasEnvironmentTopbar = !!document.querySelector('.EnvironmentTopbar');
    const dataDocNavigatorExists =
        !!document.querySelector('.DataDocNavigator');

    const querybookSidebarTourSteps: ReactourStep[] = [
        {
            selector: '.EnvironmentAppSidebar',
            content: ({ goTo }) => (
                <div>
                    <Title size="med">Welcome!</Title>
                    <p>Let's go over the sidebar functionalities.</p>
                    <hr />
                    <div>
                        <span>For the DataDoc tour, </span>
                        <Button
                            onClick={() => goTo(4)}
                            theme="text"
                            size="small"
                            title="click here"
                        />
                    </div>
                </div>
            ),
        },
        hasEnvironmentTopbar && {
            selector: '.EnvironmentTopbar',
            content: `This is the environment picker. Every environment supports different query engines. Hover on them to get more info.`,
        },
        {
            selector: '.EntitySidebar .apps-list [aria-label="DataDocs"]',
            content: (
                <>
                    <p>
                        This is the DataDoc navigator. It will show you a list
                        of the DataDocs you own, have favorited, and worked on
                        recently.
                    </p>
                    <hr />
                    <p>
                        DataDocs contain queries, text, and charts. They can be
                        shared with others.
                    </p>
                </>
            ),
        },
        dataDocNavigatorExists && {
            selector: '.DataDocNavigator .SearchBar',
            content: `You can quickly find DataDocs by using this search bar.`,
        },
        dataDocNavigatorExists && {
            selector: '.DataDocNavigator [aria-label="New DataDoc"]',
            content: (
                <>
                    <p>You can create a new DataDoc with this button.</p>
                    <hr />
                    <p>
                        Click on this button to leave this tour and start the
                        DataDoc tour.
                    </p>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list [aria-label="Adhoc Query"]',
            content: (
                <>
                    <p>
                        This is the Adhoc Editor for running simple queries. It
                        will show you a query editor in the workspace.
                    </p>
                    <hr />
                    <p>
                        Queries run on Adhoc Editor will not be saved. However,
                        you can access a list of queries you have run by
                        clicking on the Query Execution Navigator (we'll get to
                        it in a bit).
                    </p>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list [aria-label="Tables"]',
            content: `This is the Tables Navigator. It will show you a list of all the tables in each metastore. You can use the search bar to quickly find the one you want and preview them.`,
        },
        {
            selector: '.EntitySidebar .apps-list [aria-label="Snippets"]',
            content: (
                <>
                    <p>
                        This is the Snippets Navigator. You can create, filter,
                        and view all the snippets in the sidebar.
                    </p>
                    <hr />
                    <p>
                        Snippets are useful for storing queries you want to
                        reuse. Try it out! Snippets can easily be inserted into
                        DataDocs.
                    </p>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list .QueryExecutionButton',
            content: (
                <>
                    <p>
                        This is the Query Execution Navigator mentioned above.
                        It lists all recent executions.
                    </p>
                    <hr />
                    <p>
                        You can filter and search for executions to see its
                        status and the query.
                    </p>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list .SearchContainer',
            content: (
                <>
                    <p>This is the Advanced Search for DataDocs and Tables.</p>
                    <hr />
                    <p>For quick access, you can use,</p>
                    <div className="flex-row">
                        <Icon name="Command" size={16} />
                        <span> + K</span>
                    </div>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list .UserMenu',
            content: (
                <>
                    <p>
                        This is the User Settings button. It will open the
                        settings modal.
                    </p>
                    <hr />
                    <p>
                        You can create API Access Tokens here. Try out the new
                        themes here too!
                    </p>
                </>
            ),
        },
        {
            selector: '.EntitySidebar .apps-list .QueryEngineStatusButton',
            content: (
                <>
                    <p>
                        This is the Query Engine Status button. You can quickly
                        get an overview of all the query engine statuses.
                    </p>
                    <hr />
                    <p>
                        You can click on any query engine to see the detailed
                        breakdown of the resource usage of your running queries.
                    </p>
                </>
            ),
        },
        {
            content: ({ goTo }) => (
                <>
                    <p>
                        That's it! Thanks for using {getAppName()}. Please send
                        your suggestions to improve the product on&nbsp;
                        <Link to="https://github.com/pinterest/querybook">
                            GitHub
                        </Link>
                        .
                    </p>
                    <hr />
                    <div>
                        <Button
                            onClick={() => goTo(4)}
                            theme="text"
                            size="small"
                            title="Click here"
                        />
                        <span> for the DataDoc tour.</span>
                    </div>
                </>
            ),
        },
    ].filter((step) => !!step);

    return querybookSidebarTourSteps;
}

export const QuerybookSidebarUIGuide: React.FC = () => {
    const location = useLocation();
    const [steps, setSteps] = React.useState<ReactourStep[]>([]);
    const { tour: showTourInQueryString } = React.useMemo(
        () => getQueryString(),
        [location.search]
    );
    const [showTour, setShowTour] = React.useState(false);

    const startTour = React.useCallback(() => {
        trackClick({
            component: ComponentType.LANDING_PAGE,
            element: ElementType.TUTORIAL_BUTTON,
        });
        setSteps((oldTour) =>
            oldTour.length ? oldTour : getQuerybookSidebarTourSteps()
        );
        setShowTour(true);
    }, []);

    React.useEffect(() => {
        if (showTourInQueryString) {
            startTour();
        }
    }, [showTourInQueryString]);

    return (
        <>
            <Button
                className="QuerybookSidebarUIGuide"
                onClick={startTour}
                icon="Layout"
                title="UI Tutorial"
            />
            <Tour
                isOpen={showTour}
                onRequestClose={() => setShowTour(false)}
                steps={steps}
                accentColor={'var(--color-accent)'}
            />
        </>
    );
};
