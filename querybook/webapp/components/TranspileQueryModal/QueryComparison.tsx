import { diffWordsWithSpace } from 'diff';
import React, { useMemo } from 'react';

import { Button } from 'ui/Button/Button';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import './QueryComparison.scss';

export const QueryComparison: React.FC<{
    fromQuery: string;
    toQuery: string;
    fromTag?: string;
    toTag?: string;
    showControls?: boolean;
    onAccept?: (newQuery: string) => any;
    onDiscard?: () => any;
}> = ({
    fromQuery,
    toQuery,
    fromTag,
    toTag,
    showControls,
    onAccept,
    onDiscard,
}) => {
    const [addedRanges, removedRanges] = useMemo(() => {
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
    }, [fromQuery, toQuery]);

    return (
        <div className="QueryComparison">
            {showControls && (
                <div className="query-comparison-controls">
                    <Button
                        title="Accept"
                        onClick={() => onAccept(toQuery)}
                        color="accent"
                        size="small"
                    />
                    <Button
                        title="Discard"
                        size="small"
                        onClick={() => onDiscard()}
                    />
                </div>
            )}
            <div className="diff-view">
                <div className="mr8 flex1">
                    {false && (
                        <div className="center-align">
                            <AccentText weight="bold">Original</AccentText>
                        </div>
                    )}
                    {fromTag && <Tag>{fromTag}</Tag>}
                    <ThemedCodeHighlightWithMark
                        highlightRanges={removedRanges}
                        query={fromQuery}
                        maxEditorHeight={'40vh'}
                        autoHeight={true}
                    />
                </div>
                <div className="flex1">
                    {false && (
                        <div className="center-align">
                            <AccentText weight="bold">New</AccentText>
                        </div>
                    )}
                    {toTag && <Tag>{toTag}</Tag>}
                    <ThemedCodeHighlightWithMark
                        highlightRanges={addedRanges}
                        query={toQuery}
                        maxEditorHeight={'40vh'}
                        autoHeight={true}
                    />
                </div>
            </div>
        </div>
    );
};
