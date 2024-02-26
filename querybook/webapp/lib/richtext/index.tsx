import * as DraftJs from 'draft-js';
import type { Stack } from 'immutable';
import React, { useMemo } from 'react';

import { Link } from 'ui/Link/Link';

interface IUrlLinkProps {
    contentState: DraftJs.ContentState;
    entityKey: string;
}

const UrlLink: React.FunctionComponent<IUrlLinkProps> = (props) => {
    const { url }: { url: string } = props.contentState
        .getEntity(props.entityKey)
        .getData();
    const sanitizedUrl = useMemo(() => {
        // sanitize URL to prevent XSS
        try {
            const urlObj = new URL(url);
            if (['http:', 'https:'].includes(urlObj.protocol)) {
                return urlObj.href;
            } else {
                return undefined;
            }
        } catch (error) {
            return undefined;
        }
    }, [url]);

    return (
        <Link to={sanitizedUrl ?? 'about:blank'} newTab>
            {props.children}
        </Link>
    );
};

function findLinkEntities(contentBlock, callback, contentState) {
    contentBlock.findEntityRanges((character) => {
        const entityKey = character.getEntity();
        return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'LINK'
        );
    }, callback);
}

export const LinkDecorator = {
    strategy: findLinkEntities,
    component: UrlLink,
};

export function isListBlock(blockType) {
    return (
        blockType === 'unordered-list-item' || blockType === 'ordered-list-item'
    );
}

export function isSoftNewLineEvent(event: React.KeyboardEvent) {
    const enterKeyCode = 13;
    return (
        event.which === enterKeyCode &&
        (event.getModifierState('Shift') ||
            event.getModifierState('Alt') ||
            event.getModifierState('Control'))
    );
}

export type RichTextEditorCommand =
    | DraftJs.DraftEditorCommand
    | 'show-link-input';

export const RichTextEditorStyleMap = {
    STRIKETHROUGH: {
        textDecoration: 'line-through',
    },
};

export function isContentStateInUndoStack(
    contentState: DraftJs.ContentState,
    undoStack: Stack<DraftJs.ContentState>,
    numToCheck: number = -1 // Max number of elements to check, -1 for unlimited
): boolean {
    let found = false;
    let numChecked = 0;
    undoStack.forEach((undoContentState) => {
        if (undoContentState === contentState) {
            found = true;
            // breaks the loop
            return false;
        }

        numChecked++;
        if (numChecked === numToCheck) {
            return false;
        }
    });
    return found;
}
