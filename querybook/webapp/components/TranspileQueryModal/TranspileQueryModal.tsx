import { diffWordsWithSpace } from 'diff';
import React, { useCallback, useMemo } from 'react';

import { IQueryEngine } from 'const/queryEngine';
import { useResource } from 'hooks/useResource';
import { TemplatedQueryResource } from 'resource/queryExecution';
import { Button } from 'ui/Button/Button';
import { CodeHighlightWithMark } from 'ui/CodeHighlight/CodeHighlightWithMark';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { Loading } from 'ui/Loading/Loading';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import './TranspileQueryModal.scss';

interface IProps {
    query: string;
    transpilerName: string;
    toEngine: IQueryEngine;
    fromEngine: IQueryEngine;

    onTranspileConfirm: (query: string, engine: IQueryEngine) => void;
    onHide: () => void;
}

export const TranspileQueryModal: React.FC<IProps> = ({
    query,
    transpilerName,
    toEngine,
    fromEngine,
    onHide,
    onTranspileConfirm,
}) => {
    const { data: transpiledQuery, isLoading } = useResource(
        useCallback(
            () =>
                TemplatedQueryResource.transpileQuery(
                    transpilerName,
                    query,
                    fromEngine.language,
                    toEngine.language
                ),
            [transpilerName, query, fromEngine, toEngine]
        )
    );

    let contentDOM = null;
    let bottomDOM = null;
    if (isLoading) {
        contentDOM = <Loading />;
    } else {
        contentDOM = (
            <QueryComparison
                fromQuery={query}
                toQuery={transpiledQuery}
                fromEngine={fromEngine}
                toEngine={toEngine}
            />
        );

        bottomDOM = (
            <div className="right-align mb16">
                <Button title="Cancel" onClick={onHide} />
                <Button
                    title="Confirm"
                    color="confirm"
                    onClick={() =>
                        onTranspileConfirm(transpiledQuery, toEngine)
                    }
                />
            </div>
        );
    }

    return (
        <Modal onHide={onHide} bottomDOM={bottomDOM}>
            {contentDOM}
        </Modal>
    );
};

const QueryComparison: React.FC<{
    fromQuery: string;
    toQuery: string;
    fromEngine: IQueryEngine;
    toEngine: IQueryEngine;
}> = ({ fromQuery, toQuery, fromEngine, toEngine }) => {
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
            <div className="mr8 flex1">
                <div className="center-align">
                    <AccentText weight="bold">Original</AccentText>
                </div>
                <Tag>{fromEngine.name}</Tag>

                <CodeHighlightWithMark
                    highlightRanges={removedRanges}
                    query={fromQuery}
                    maxEditorHeight={'40vh'}
                    autoHeight={false}
                />
            </div>
            <div className="flex1">
                <div className="center-align">
                    <AccentText weight="bold">Transpiled</AccentText>
                </div>
                <Tag>{toEngine.name}</Tag>
                <CodeHighlightWithMark
                    highlightRanges={addedRanges}
                    query={toQuery}
                    maxEditorHeight={'40vh'}
                    autoHeight={false}
                />
            </div>
        </div>
    );
};
