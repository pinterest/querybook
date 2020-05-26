import * as DraftJs from 'draft-js';
import React from 'react';
import { Link } from 'ui/Link/Link';

interface IUrlLinkProps {
    contentState: DraftJs.ContentState;
    entityKey: string;
}

const UrlLink: React.FunctionComponent<IUrlLinkProps> = (props) => {
    const { url } = props.contentState.getEntity(props.entityKey).getData();
    return (
        <Link to={url} newTab>
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

// Used mainly for chart descriptions, which could still be strings or raw
export function convertRawToContentState(raw: string): DraftJs.ContentState {
    try {
        if (raw) {
            const result = JSON.parse(raw);
            return DraftJs.convertFromRaw(result);
        } else {
            return DraftJs.ContentState.createFromText('');
        }
    } catch (e) {
        const htmlBlocks = DraftJs.convertFromHTML((raw as string) || '');

        const contentState = htmlBlocks.contentBlocks
            ? DraftJs.ContentState.createFromBlockArray(
                  htmlBlocks.contentBlocks,
                  htmlBlocks.entityMap
              )
            : DraftJs.ContentState.createFromText('');

        return contentState;
    }
}

export type RichTextEditorCommand =
    | DraftJs.DraftEditorCommand
    | 'show-link-input';

export const RichTextEditorStyleMap = {
    STRIKETHROUGH: {
        textDecoration: 'line-through',
    },
};
