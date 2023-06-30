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
    hideEmptyQuery?: boolean;
}> = ({
    fromQuery,
    toQuery,
    fromQueryTitle,
    toQueryTitle,
    disableHighlight,
    hideEmptyQuery,
}) => {
    const hasHiddenQuery = hideEmptyQuery && (!fromQuery || !toQuery);

    const [addedRanges, removedRanges] = useMemo(() => {
        if (disableHighlight || hasHiddenQuery) {
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
    }, [fromQuery, toQuery, disableHighlight, hideEmptyQuery]);

    return (
        <div className="QueryComparison">
            {!(hideEmptyQuery && !fromQuery) && (
                <div className="diff-side-view">
                    {fromQueryTitle && <Tag>{fromQueryTitle}</Tag>}
                    <ThemedCodeHighlightWithMark
                        highlightRanges={removedRanges}
                        query={fromQuery}
                        maxEditorHeight={'40vh'}
                        autoHeight={false}
                    />
                </div>
            )}
            {!(hideEmptyQuery && !toQuery) && (
                <div className="diff-side-view">
                    {toQueryTitle && <Tag>{toQueryTitle}</Tag>}
                    <ThemedCodeHighlightWithMark
                        highlightRanges={addedRanges}
                        query={toQuery}
                        maxEditorHeight={'40vh'}
                        autoHeight={false}
                    />
                </div>
            )}
        </div>
    );
};
