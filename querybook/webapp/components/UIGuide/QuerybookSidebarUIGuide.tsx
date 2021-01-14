import React from 'react';
import Tour, { ReactourStep } from 'reactour';
import { useLocation } from 'react-router-dom';

import { getQueryString } from 'lib/utils/query-string';

import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Title } from 'ui/Title/Title';

export const QuerybookSidebarTourSteps: ReactourStep[] = [
    {
        selector: '.EnvironmentAppSidebar',
        content: ({ goTo }) => (
            <div>
                <Title size={5}>Welcome!</Title>
                <p>Let's go over the sidebar functionalities.</p>
                <hr />
                <div>
                    <span>For the DataDoc tour, </span>
                    <Button onClick={() => goTo(4)} borderless small>
                        click here
                    </Button>
                </div>
            </div>
        ),
    },
    {
        selector: '.EnvironmentTopbar',
        content: `This is the environment picker. Every environment supports different query engines. Hover on them to get more info.`,
    },
    {
        selector: '.EntitySidebar .apps-list [aria-label="DataDoc"]',
        content: (
            <>
                <p>
                    This is the DataDoc navigator. It will show you a list of
                    the DataDocs you own, have favorited, and worked on
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
    {
        selector: '.DataDocNavigator .SearchBar',
        content: `You can quickly find DataDocs by using this search bar.`,
    },
    {
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
                    This is the Adhoc Editor for running simple queries. It will
                    show you an query editor in the workspace.
                </p>
                <hr />
                <p>
                    Queries run on Adhoc Editor will not be saved. However, you
                    can access a list of queries you have run by clicking on the
                    Query Execution Navigator (we'll get to it in a bit).
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
                    This is the Snippets Navigator. You can create, filter, and
                    view all the snippets in the sidebar.
                </p>
                <hr />
                <p>
                    Snippets are useful for storing queries you want to reuse.
                    Try it out! Snippets can easily be inserted into DataDocs.
                </p>
            </>
        ),
    },
    {
        selector: '.EntitySidebar .apps-list .QueryExecutionButton',
        content: (
            <>
                <p>
                    This is the Query Execution Navigator mentioned above. It
                    lists all recent executions.
                </p>
                <hr />
                <p>
                    You can filter and search for executions to see its status
                    and the query.
                </p>
            </>
        ),
    },
    {
        selector:
            '.EntitySidebar .sidebar-footer [aria-label="Search in Querybook"]',
        content: (
            <>
                <p>This is the Advanced Search for DataDocs and Tables.</p>
                <hr />
                <p>For quick access, you can use,</p>
                <div className="flex-row">
                    <Icon name="command" size={16} />
                    <span> + K</span>
                </div>
            </>
        ),
    },
    {
        selector: '.EntitySidebar .sidebar-footer .UserMenu',
        content: (
            <>
                <p>
                    This is the User Settings button. It will open the settings
                    modal.
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
        selector: '.EntitySidebar .sidebar-footer .QueryEngineStatusButton',
        content: (
            <>
                <p>
                    This is the Query Engine Status button. You can quickly get
                    an overview of all the query engine statuses.
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
        // selector: '.EntitySidebar .sidebar-footer .QueryEngineStatusButton',
        content: ({ goTo }) => (
            <>
                <p>
                    That's it! Thanks for using Querybook and feel free to
                    contact us on #querybook!
                </p>
                <hr />
                <div>
                    <Button onClick={() => goTo(4)} borderless small>
                        Click here
                    </Button>
                    <span> for the DataDoc tour.</span>
                </div>
            </>
        ),
    },
];

export const QuerybookSidebarUIGuide: React.FC = () => {
    const location = useLocation();
    const { tour } = React.useMemo(() => getQueryString(), [location.search]);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (tour) {
            setIsOpen(true);
        }
    }, [tour]);

    return (
        <>
            <Button
                className="Tour-button"
                onClick={() => setIsOpen(true)}
                borderless
                inverted
            >
                Querybook UI Tutorial
            </Button>
            <Tour
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                steps={QuerybookSidebarTourSteps}
                accentColor={'var(--color-accent)'}
            />
        </>
    );
};
