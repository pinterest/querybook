import * as DraftJs from 'draft-js';
import {
    IDataDoc,
    IDataDocSearchResult,
    IDataDocSearchOptions,
    IDataDocSearchState,
} from 'const/datadoc';

export function searchDataDoc(
    dataDoc: IDataDoc,
    searchString: string,
    options: IDataDocSearchOptions
) {
    const searchRegex = getSearchRegex(searchString, options);
    const results: IDataDocSearchResult[] = [];

    if (!searchRegex) {
        return results;
    }
    for (const cell of dataDoc.dataDocCells) {
        if (cell.cell_type === 'query') {
            const content = cell.context;
            let match: RegExpExecArray;
            // tslint:disable-next-line
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
                // tslint:disable-next-line
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

function getSearchRegex(
    searchString: string,
    searchOptions: IDataDocSearchOptions
) {
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
    searchOptions: IDataDocSearchOptions
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
    searchOptions: IDataDocSearchOptions
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
        // tslint:disable-next-line
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

function replaceDraftJsContent(
    contentState: DraftJs.ContentState,
    items: IDataDocSearchResult[],
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

export async function replace(
    dataDoc: IDataDoc,
    item: IDataDocSearchResult,
    replaceString: string,
    onChange: (
        cellId: number,
        context: string | DraftJs.ContentState
    ) => Promise<any>
) {
    if (!item) {
        return;
    }

    const cell = dataDoc.dataDocCells.find((c) => c.id === item.cellId);

    if (!cell) {
        return;
    }

    if (cell.cell_type === 'query') {
        const newString = replaceStringIndices(
            cell.context,
            [[item.from, item.to]],
            replaceString
        );
        await onChange(cell.id, newString);
    } else if (cell.cell_type === 'text') {
        await onChange(
            cell.id,
            replaceDraftJsContent(cell.context, [item], replaceString)
        );
    }
}

export async function replaceAll(
    dataDoc: IDataDoc,
    items: IDataDocSearchResult[],
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
