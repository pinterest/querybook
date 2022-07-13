import React from 'react';
import { ReactourStep } from 'reactour';

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
];
