import * as DraftJs from 'draft-js';
import React, { useEffect, useMemo } from 'react';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import { makeSearchHighlightDecorator } from 'components/SearchAndReplace/SearchHighlightDecorator';
import { ISearchAndReplaceContextType } from 'context/searchAndReplace';
import { LinkDecorator } from 'lib/richtext';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

export const DraftJsSearchHighlighter: React.FC<{
    editor: RichTextEditor;
    cellId: number;
    searchContext: ISearchAndReplaceContextType;
}> = ({ editor, cellId, searchContext }) => {
    const {
        searchState: {
            searchResults,
            searchString,
            searchOptions,
            currentSearchResultIndex,
        },
        focusSearchBar,
    } = searchContext;

    const shouldHighlight = useMemo(
        () => editor && searchResults.some((r) => r.cellId === cellId),
        [searchResults, cellId, editor]
    );
    useEffect(() => {
        if (editor) {
            const decorators = [LinkDecorator];
            if (shouldHighlight) {
                decorators.push(
                    makeSearchHighlightDecorator(searchString, searchOptions)
                );
            }

            editor.editorState = DraftJs.EditorState.set(editor.editorState, {
                decorator: new DraftJs.CompositeDecorator(decorators),
            });
        }
    }, [shouldHighlight, editor, searchString, searchOptions]);

    // jump to item
    const currentSearchItem = useMemo(() => {
        const item = searchResults[currentSearchResultIndex];
        if (item?.cellId === cellId) {
            return item;
        }
        return null;
    }, [currentSearchResultIndex, cellId, searchResults]);

    useEffect(() => {
        if (currentSearchItem && editor) {
            // editor.focus();
            const selectionState: DraftJs.SelectionState =
                new DraftJs.SelectionState({
                    anchorKey: currentSearchItem.blockKey,
                    anchorOffset: currentSearchItem.from,
                    focusKey: currentSearchItem.blockKey,
                    focusOffset: currentSearchItem.to,
                    hasFocus: false,
                    isBackward: false,
                });
            editor.editorState = DraftJs.EditorState.forceSelection(
                editor.editorState,
                selectionState
            );
            setTimeout(() => {
                // Known issues: Pressing enter too fast
                // would cause the enter to be applied to the draft js
                // rich text editor, so setting a force blur after 50ms
                // to prevent the editor to be accidentally edited
                const element = window.getSelection().focusNode.parentElement;
                editor.draftJSEditor?.blur();

                setTimeout(() => {
                    // The DataDoc scrolls to the cell (sometimes its lazy loaded)
                    // however we also want to make sure we scroll to the element
                    // itself, so added a double scroll after 500ms to make sure
                    // it happens after the DataDoc scroll
                    scrollIntoView(element, {
                        scrollMode: 'if-needed',
                        duration: 0,
                    });
                    focusSearchBar();
                }, 50);
            }, 50);
        }
    }, [currentSearchResultIndex]);

    return null;
};
