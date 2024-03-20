import React, { useEffect, useMemo } from 'react';

import { ISearchAndReplaceContextType } from 'context/searchAndReplace';
import { getCodemirrorOverlay } from 'lib/data-doc/search';

export const CodeMirrorSearchHighlighter: React.FC<{
    editor: CodeMirror.Editor;
    cellId: number;

    searchContext: ISearchAndReplaceContextType;
}> = ({ editor, cellId, searchContext }) => {
    const {
        searchState: {
            searchResults,
            searchString,
            currentSearchResultIndex,
            searchOptions,
        },
    } = searchContext;

    const shouldHighlight = useMemo(
        () => editor && searchResults.some((r) => r.cellId === cellId),
        [searchResults, cellId, editor]
    );

    // highlighter
    useEffect(() => {
        const overlay = shouldHighlight
            ? getCodemirrorOverlay(searchString, searchOptions)
            : null;

        if (overlay) {
            editor.addOverlay(overlay);
        }

        return () => {
            if (overlay) {
                editor.removeOverlay(overlay);
            }
        };
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
            const doc = editor.getDoc();
            doc.setSelection(
                doc.posFromIndex(currentSearchItem.from),
                doc.posFromIndex(currentSearchItem.to),
                {
                    scroll: true,
                }
            );
        }
    }, [currentSearchItem]);

    return null;
};
