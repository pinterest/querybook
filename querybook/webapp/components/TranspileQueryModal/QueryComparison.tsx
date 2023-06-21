import { diffWordsWithSpace } from 'diff';
import React, { useMemo } from 'react';

import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { Tag } from 'ui/Tag/Tag';

import './QueryComparison.scss';

export const QueryComparison: React.FC<{
    fromQuery: string;
    toQuery: string;
    fromQueryTitle?: string;
    toQueryTitle?: string;
    disableHighlight?: boolean;
}> = ({
    fromQuery,
    toQuery,
    fromQueryTitle,
    toQueryTitle,
    disableHighlight,
}) => {
    const [addedRanges, removedRanges] = useMemo(() => {
        if (disableHighlight) {
            return [[], []];
        }

        const added: IHighlightRange[] = [];
        const removed: IHighlightRange[] = [];
        const diffObjects = diffWordsWithSpace(fromQuery, toQuery);

        let currentAddedIdx = 0;
        let currentRemovedIdx = 0;
        for (const diff of diffObjects) {
            const diffLen = diff.value.length;
            if (diff.added) {
                added.push({
                    from: currentAddedIdx,
                    to: currentAddedIdx + diffLen,
                    className: 'code-highlight-green',
                });
                currentAddedIdx += diffLen;
            } else if (diff.removed) {
                removed.push({
                    from: currentRemovedIdx,
                    to: currentRemovedIdx + diffLen,
                    className: 'code-highlight-red',
                });
                currentRemovedIdx += diffLen;
            } else {
                currentAddedIdx += diffLen;
                currentRemovedIdx += diffLen;
            }
        }
        return [added, removed];
    }, [fromQuery, toQuery, disableHighlight]);

    return (
        <div className="QueryComparison">
            <div className="mr8 flex1">
                {fromQueryTitle && <Tag>{fromQueryTitle}</Tag>}
                <ThemedCodeHighlightWithMark
                    highlightRanges={removedRanges}
                    query={fromQuery}
                    maxEditorHeight={'40vh'}
                    autoHeight={false}
                />
            </div>
            <div className="flex1">
                {toQueryTitle && <Tag>{toQueryTitle}</Tag>}
                <ThemedCodeHighlightWithMark
                    highlightRanges={addedRanges}
                    query={toQuery}
                    maxEditorHeight={'40vh'}
                    autoHeight={false}
                />
            </div>
        </div>
    );
};
