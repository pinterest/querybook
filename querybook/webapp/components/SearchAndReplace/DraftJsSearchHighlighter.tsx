import * as DraftJs from 'draft-js';
import React, { useEffect, useMemo } from 'react';
import scrollIntoView from 'smooth-scroll-into-view-if-needed';

import { makeSearchHighlightDecorator } from 'components/SearchAndReplace/SearchHighlightDecorator';
import { ISearchAndReplaceContextType } from 'context/searchAndReplace';
import { LinkDecorator } from 'lib/richtext';
import type { IRichTextEditorHandles } from 'ui/RichTextEditor/RichTextEditor';

export const DraftJsSearchHighlighter: React.FC<{
    editorRef: React.MutableRefObject<IRichTextEditorHandles>;
    cellId: number;
    searchContext: ISearchAndReplaceContextType;
}> = ({ editorRef, cellId, searchContext }) => {
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
        () =>
            editorRef.current && searchResults.some((r) => r.cellId === cellId),
        [searchResults, cellId, editorRef]
    );
    useEffect(() => {
        if (editorRef.current) {
            const decorators = [LinkDecorator];
            if (shouldHighlight) {
                decorators.push(
                    makeSearchHighlightDecorator(searchString, searchOptions)
                );
            }

            editorRef.current.setEditorState(
                DraftJs.EditorState.set(editorRef.current.getEditorState(), {
                    decorator: new DraftJs.CompositeDecorator(decorators),
                })
            );
        }
    }, [shouldHighlight, editorRef, searchString, searchOptions]);

    // jump to item
    const currentSearchItem = useMemo(() => {
        const item = searchResults[currentSearchResultIndex];
        if (item?.cellId === cellId) {
            return item;
        }
        return null;
    }, [currentSearchResultIndex, cellId, searchResults]);

    useEffect(() => {
        if (currentSearchItem && editorRef.current) {
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
            editorRef.current.setEditorState(
                DraftJs.EditorState.forceSelection(
                    editorRef.current.getEditorState(),
                    selectionState
                )
            );
            setTimeout(() => {
                // Known issues: Pressing enter too fast
                // would cause the enter to be applied to the draft js
                // rich text editor, so setting a force blur after 50ms
                // to prevent the editor to be accidentally edited
                const element = window.getSelection().focusNode.parentElement;
                editorRef.current.getDraftJsEditor()?.blur();

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
