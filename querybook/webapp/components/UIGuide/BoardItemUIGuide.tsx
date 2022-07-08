import React from 'react';
import { useLocation } from 'react-router-dom';
import Tour, { ReactourStep } from 'reactour';

import { getQueryString } from 'lib/utils/query-string';
import { Button } from 'ui/Button/Button';

export const BoardItemTourSteps: ReactourStep[] = [
    {
        selector: '.Board .BoardItem',
        content: <p>This is a list item.</p>,
    },
    {
        selector: '.Board .BoardItem .BoardItem-controls',
        content: (
            <p>
                You can add this item to another list or collapse it from here.
            </p>
        ),
    },
    {
        selector: '.Board .BoardItem .EditableTextField',
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
                If the list item is a table, you can choose to show the table
                description instead of the list item description by toggling a
                button below the descriptions.
            </p>
        ),
    },
];

export const BoardItemUIGuide: React.FunctionComponent = () => {
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
            <Button
                onClick={() => setIsOpen(true)}
                title="Begin List Item Tour"
            />
            <Tour
                isOpen={isOpen}
                onRequestClose={() => setIsOpen(false)}
                steps={BoardItemTourSteps}
                accentColor={'var(--color-accent)'}
            />
        </div>
    );
};
