import React from 'react';
import { ReactourStep } from 'reactour';

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
