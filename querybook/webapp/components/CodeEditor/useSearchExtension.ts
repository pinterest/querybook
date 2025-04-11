import {
    closeSearchPanel,
    openSearchPanel,
    search,
    SearchQuery,
    setSearchQuery,
} from '@codemirror/search';
import {
    EditorSelection,
    EditorView,
    keymap,
    Prec,
} from '@uiw/react-codemirror';
import { useContext, useEffect, useMemo } from 'react';

import { SearchAndReplaceContext } from 'context/searchAndReplace';

export const useSearchExtension = ({
    editorView,
    cellId,
}: {
    editorView: EditorView;
    cellId: number;
}) => {
    const searchContext = useContext(SearchAndReplaceContext);
    useEffect(() => {
        if (editorView && searchContext) {
            if (searchContext.showing) {
                // this is a hack to make sure the built-in search panel is open
                // as the built-in highlighter will only works when the search panel is open.
                // and we have set the display:none for the search panel
                openSearchPanel(editorView);
            } else {
                closeSearchPanel(editorView);
            }
        }
    }, [editorView, searchContext?.showing]);

    const shouldHighlight = useMemo(
        () =>
            editorView &&
            searchContext?.showing &&
            searchContext?.searchState?.searchResults.some(
                (r) => r.cellId === cellId
            ),
        [cellId, editorView, searchContext]
    );

    useEffect(() => {
        if (shouldHighlight) {
            const { searchString, searchOptions } = searchContext.searchState;

            editorView?.dispatch({
                effects: setSearchQuery.of(
                    new SearchQuery({
                        search: searchString,
                        caseSensitive: searchOptions.matchCase,
                        regexp: searchOptions.useRegex,
                    })
                ),
                selection: EditorSelection.single(0),
            });
        }
    }, [shouldHighlight, editorView, searchContext]);

    useEffect(() => {
        if (!!searchContext) {
            const { searchResults, currentSearchResultIndex } =
                searchContext.searchState;
            const item = searchResults[currentSearchResultIndex];
            if (!item || item.cellId !== cellId) {
                return;
            }

            if (shouldHighlight) {
                editorView?.dispatch({
                    selection: EditorSelection.single(item.from, item.to),
                    effects: EditorView.scrollIntoView(item.from),
                });
            } else {
                editorView?.dispatch({
                    selection: EditorSelection.single(item.from),
                });
            }
        }
    }, [shouldHighlight, searchContext]);

    const extension = useMemo(
        () => [
            search(),
            Prec.highest(
                keymap.of([
                    {
                        key: 'Cmd-f',
                        run: () => {
                            searchContext?.showSearchAndReplace();
                            return true;
                        },
                    },
                ])
            ),
        ],
        []
    );

    return extension;
};
