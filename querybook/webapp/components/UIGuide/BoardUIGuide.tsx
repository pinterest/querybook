import React from 'react';
import { useLocation } from 'react-router-dom';
import Tour, { ReactourStep } from 'reactour';

import { getQueryString } from 'lib/utils/query-string';
import { Button } from 'ui/Button/Button';
import { Title } from 'ui/Title/Title';

export const BoardTourSteps: ReactourStep[] = [
    {
        content: (
            <div>
                <Title size="med">Welcome to List!</Title>
                <p>Let's go over the List interface.</p>
            </div>
        ),
    },
    {
        selector: '.BoardHeader-title',
        content: `This is the title of List. We recommend adding a descriptive title to make searching easier.`,
    },
    {
        selector: '.Board .BoardHeader [aria-label="Add to another list"]',
        content: (
            <>
                <p>You can add this list to another list from here.</p>
            </>
        ),
    },
    {
        selector: '.Board .BoardHeader-users',
        content: (
            <>
                <p>
                    You can click here to toggle access settings, invite others
                    to collaborate, and set permissions
                </p>
            </>
        ),
    },
    {
        selector: '.BoardHeader .EditableTextField',
        content: `This is the description of List. We recommend a detailed description for public lists to help others use the list in the intended way.`,
    },
    {
        selector: '.Board .BoardHeader-add-buttons',
        content: (
            <>
                <p>
                    This section allows you to add different kind of items to a
                    List.
                </p>
                <hr />
                <p>
                    Clicking on the buttons will open the search modal with an
                    easy button to add items to the list.
                </p>
            </>
        ),
    },
    {
        selector:
            '.Board .BoardRightSidebar [aria-label="Collapse query cells"]',
        content: (
            <>
                <p>You can collapse and open the items with this button.</p>
            </>
        ),
    },
    {
        selector:
            '.Board .BoardRightSidebar [aria-label="Edit Mode: reorder & delete items"]',
        content: (
            <>
                <p>You reorder and delete items in Edit Mode.</p>
            </>
        ),
    },
    {
        selector: '.Board .BoardHeader-add-table',
        content: `Click on an add button to add a table to the list!`,
    },
    {
        selector: '.Board .BoardItem',
        content: <p>This is a table list item.</p>,
    },
    {
        selector: '.Board .BoardItem .BoardItem-controls',
        content: (
            <p>
                You can add this table to another list or collapse it from here.
            </p>
        ),
    },
    {
        selector: '.Board .BoardItem .BoardItem-description',
        content: (
            <p>
                You can add a description of this list item. The description
                only exists within this list.
            </p>
        ),
    },
    {
        selector: '.Board .BoardItem .BoardItem-description-toggle',
        content: (
            <p>
                You can choose to show the table description instead of the list
                item description by toggling this button.
            </p>
        ),
    },
];

export const BoardUIGuide: React.FunctionComponent = () => {
    const location = useLocation();
    const { tour } = React.useMemo(() => getQueryString(), [location.search]);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        if (tour) {
            setIsOpen(true);
        }
    }, [tour]);
    return (
        <div className="ListUIGuide flex-center mt16">
            <Button onClick={() => setIsOpen(true)} title="Begin List Tour" />
            <Tour
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                steps={BoardTourSteps}
                accentColor={'var(--color-accent)'}
            />
        </div>
    );
};
