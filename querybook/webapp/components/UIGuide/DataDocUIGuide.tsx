import React from 'react';
import { useLocation } from 'react-router-dom';
import Tour, { ReactourStep } from 'reactour';

import { getQueryString } from 'lib/utils/query-string';
import { IconButton } from 'ui/Button/IconButton';
import { Title } from 'ui/Title/Title';

export const DataDocTourSteps: ReactourStep[] = [
    {
        content: (
            <div>
                <Title size="med">Welcome to DataDoc!</Title>
                <p>Let's go over the DataDoc interface.</p>
            </div>
        ),
    },
    {
        selector: '.DataDoc .data-doc-title',
        content: `This is the title of DataDoc. We recommend adding a descriptive title to make searching easier.`,
    },

    {
        selector: '.DataDoc .IconButton.favorite-icon-button',
        content: (
            <>
                <p>You can favorite a DataDoc by clicking here.</p>
                <hr />
                <p>
                    Favorited DataDocs will appear under the Favorite tab in the
                    sidebar.
                </p>
            </>
        ),
    },
    {
        selector: '.DataDoc .data-doc-header-users',
        content: (
            <>
                <p>
                    This section shows everyone currently viewing this DataDoc.
                </p>
                <hr />
                <p>
                    You can click here to toggle access settings, invite others
                    to collaborate, and set permissions
                </p>
            </>
        ),
    },
    {
        selector: '.DataDoc .block-crud-buttons ',
        content: (
            <>
                <p>Hover over the highlighted area!</p>
                <hr />
                <p>
                    This section allows you to add different kind of cells to a
                    DataDoc. You can think of DataDoc as a list of cells.
                </p>
                <hr />
                <p>
                    <b>Text cell</b> allows you to document your investigation
                    or make notes. It supports rich text editing.
                </p>
                <hr />
                <p>
                    <b>Query cell</b> is the most <b>important</b> type of cell.
                    You can use it to write and run queries.
                </p>
                <hr />
                <p>
                    <b>Chart cell</b> allows you to make visuatizations based on
                    execution results.
                </p>
            </>
        ),
    },
    {
        selector:
            '.DataDoc .DataDocRightSidebar-button-section-bottom [aria-label="Set Variables"]',
        content: (
            <>
                <p>
                    You can add templated variables here! Use double curly
                    brackets to access templates within the query.
                </p>
                <hr />
                <p>
                    For example, if you have a template named "today", you can:
                </p>
                <pre>dt=&#123;&#123;today&#125;&#125;</pre>
            </>
        ),
    },
    {
        selector:
            '.DataDoc .DataDocRightSidebar-button-section-bottom [aria-label="Schedule DataDoc"]',
        content: `You can create a scheduler to run queries automatically. You can configure
it to run daily, weekly, or monthly.`,
    },
    {
        selector:
            '.DataDoc .DataDocRightSidebar-button-section-bottom [aria-label="Clone"]',
        content: `You can clone a DataDoc by clicking here.`,
    },
    {
        selector:
            '.DataDoc .DataDocRightSidebar-button-section-bottom [aria-label="Delete"]',
        content: `You can archive a DataDoc by clicking here. Archived DataDocs can be recovered.`,
    },
    {
        selector: '.DataDoc',
        content: `Click on a button to create your first cell!`,
    },
    {
        selector: '.DataDoc .DataDocLeftSidebar .contents-toggle-button',
        content: (
            <>
                <p>
                    Lastly, you can use this Contents button to see a quick
                    summary of your DataDoc and quickly access cells.
                </p>
                <hr />
                <p>
                    Don't see it? Make sure you created a cell in the last step!
                </p>
            </>
        ),
    },
];

export const DataDocUIGuide: React.FunctionComponent = () => {
    const location = useLocation();
    const { tour } = React.useMemo(() => getQueryString(), [location.search]);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (tour) {
            setIsOpen(true);
        }
    }, [tour]);
    return (
        <div className="DataDocUIGuide flex-center">
            <IconButton
                onClick={() => setIsOpen(true)}
                icon="HelpCircle"
                tooltipPos="left"
                tooltip="DataDoc UI Guide"
            />
            <Tour
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                steps={DataDocTourSteps}
                accentColor={'var(--color-accent)'}
            />
        </div>
    );
};
