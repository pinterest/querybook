import * as DraftJs from 'draft-js';

import { IDataCell, IDataDoc } from 'const/datadoc';
import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';

export function searchText(
    text: string,
    searchString: string,
    options: ISearchOptions
) {
    const searchRegex = getSearchRegex(searchString, options);
    const results: ISearchResult[] = [];

    if (!searchRegex) {
        return results;
    }

    let match: RegExpExecArray;
    // eslint-disable-next-line
    while ((match = searchRegex.exec(text)) !== null) {
        results.push({
            from: match.index,
            to: match.index + match[0].length,
        });
    }

    return results;
}

export function searchDataDocCells(
    dataDocCells: IDataCell[],
    searchString: string,
    options: ISearchOptions
) {
    const searchRegex = getSearchRegex(searchString, options);
    const results: ISearchResult[] = [];

    if (!searchRegex) {
        return results;
    }
    for (const cell of dataDocCells) {
        if (cell.cell_type === 'query') {
            const content = cell.context;
            let match: RegExpExecArray;
            // eslint-disable-next-line
            while ((match = searchRegex.exec(content)) !== null) {
                results.push({
                    cellId: cell.id,
                    from: match.index,
                    to: match.index + match[0].length,
                });
            }
        } else if (cell.cell_type === 'text') {
            const content = cell.context;
            content.getBlockMap().map((contentBlock) => {
                let match: RegExpExecArray;
                const blockText = contentBlock.getText();
                // eslint-disable-next-line
                while ((match = searchRegex.exec(blockText)) !== null) {
                    results.push({
                        cellId: cell.id,
                        blockKey: contentBlock.getKey(),
                        from: match.index,
                        to: match.index + match[0].length,
                    });
                }
            });
        }
    }

    return results;
}

function getSearchRegex(searchString: string, searchOptions: ISearchOptions) {
    if (!searchString) {
        return null;
    }

    let searchRegex = searchString;
    if (!searchOptions.useRegex) {
        // escape all regex parameters
        searchRegex = searchRegex.replace(
            /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
            '\\$&'
        );
    }

    let flags = 'g';
    if (!searchOptions.matchCase) {
        flags += 'i';
    }

    return new RegExp(searchRegex, flags);
}

export function getCodemirrorOverlay(
    searchString: string,
    searchOptions: ISearchOptions
) {
    const searchRegex = getSearchRegex(searchString, searchOptions);
    return {
        token: (stream: CodeMirror.StringStream) => {
            if (!searchRegex) {
                stream.skipToEnd();
                return;
            }

            searchRegex.lastIndex = stream.pos;
            const match = searchRegex.exec(stream.string);
            if (match && match.index === stream.pos) {
                stream.pos += match[0].length || 1;
                return 'searching';
            } else if (match) {
                stream.pos = match.index;
            } else {
                stream.skipToEnd();
            }
        },
    };
}

export const findSearchEntities = (
    searchString: string,
    searchOptions: ISearchOptions
) => {
    const searchRegex = getSearchRegex(searchString, searchOptions);
    return (
        contentBlock: DraftJs.ContentBlock,
        callback: (start: number, end: number) => void
    ) => {
        if (!searchRegex) {
            return;
        }

        let match: RegExpExecArray;
        const blockText = contentBlock.getText();
        // eslint-disable-next-line
        while ((match = searchRegex.exec(blockText)) !== null) {
            callback(match.index, match.index + match[0].length);
        }
    };
};

// Move this to a utils function?
export function replaceStringIndices(
    s: string,
    indices: Array<[number, number]>,
    replaceString: string
) {
    const replaceLen = replaceString.length;
    let offset = 0;
    let ret = s;

    for (const pair of indices) {
        const start = pair[0] + offset;
        const end = pair[1] + offset;
        const len = pair[1] - pair[0];

        ret = ret.substr(0, start) + replaceString + ret.substr(end);
        offset += replaceLen - len;
    }

    return ret;
}

export function replaceDraftJsContent(
    contentState: DraftJs.ContentState,
    items: ISearchResult[],
    replaceString: string
) {
    const selectionsToReplace = items.map(
        (item) =>
            new DraftJs.SelectionState({
                anchorKey: item.blockKey,
                anchorOffset: item.from,
                focusKey: item.blockKey,
                focusOffset: item.to,
                hasFocus: false,
                isBackward: false,
            })
    );

    let newContentState = contentState;
    for (const selection of selectionsToReplace) {
        newContentState = DraftJs.Modifier.replaceText(
            newContentState,
            selection,
            replaceString
        );
    }

    return newContentState;
}

export async function replaceDataDoc(
    dataDoc: IDataDoc,
    items: ISearchResult[],
    replaceString: string,
    onChange: (
        cellId: number,
        context: string | DraftJs.ContentState
    ) => Promise<any>
) {
    if (!items?.length) {
        return;
    }

    const allChanges: Array<Promise<any>> = [];
    for (const cell of dataDoc.dataDocCells) {
        const itemsForCell = items.filter((item) => item.cellId === cell.id);
        if (!itemsForCell.length) {
            continue;
        }

        if (cell.cell_type === 'query') {
            const newString = replaceStringIndices(
                cell.context,
                itemsForCell.map((item) => [item.from, item.to]),
                replaceString
            );
            allChanges.push(onChange(cell.id, newString));
        } else if (cell.cell_type === 'text') {
            allChanges.push(
                onChange(
                    cell.id,
                    replaceDraftJsContent(
                        cell.context,
                        itemsForCell,
                        replaceString
                    )
                )
            );
        }
    }

    await Promise.all(allChanges);
}
