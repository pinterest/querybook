import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IQueryExecution } from 'const/queryExecution';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { TextButton } from 'ui/Button/Button';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { Loading } from 'ui/Loading/Loading';
import { Tag } from 'ui/Tag/Tag';

import './ExecutedQueryCell.scss';

interface IProps {
    queryExecution: IQueryExecution;
    highlightRange?: IHighlightRange;
    onUpdateQuery?: (query: string, run?: boolean) => void;

    maxEditorHeight?: string;
}

export const ExecutedQueryCell: React.FunctionComponent<IProps> = ({
    queryExecution,
    onUpdateQuery,
    highlightRange,
    maxEditorHeight: editorHeight,
}) => {
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const highlightRanges = useMemo(
        () => (highlightRange ? [highlightRange] : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [highlightRange.from, highlightRange.to, highlightRange.className]
    );

    if (!queryExecution) {
        return <Loading />;
    }

    const { query } = queryExecution;
    const pasteQueryButton = onUpdateQuery && (
        <TextButton
            onClick={() => {
                onUpdateQuery(query);
            }}
            aria-label={'Copy and Paste this into the query editor above'}
            data-balloon-pos={'left'}
            key="replace"
            size="small"
            icon="Terminal"
            title="Paste Query in Editor"
        />
    );

    const queryEngine = queryEngineById[queryExecution.engine_id];
    const headerDOM = (
        <div className="execution-header horizontal-space-between mb4">
            <Tag mini>{queryEngine.name}</Tag>
            {pasteQueryButton}
        </div>
    );

    const codeDOM = (
        <ThemedCodeHighlightWithMark
            query={query}
            highlightRanges={highlightRanges}
            maxEditorHeight={editorHeight}
        />
    );

    return (
        <div className="ExecutedQueryCell">
            {headerDOM}
            {codeDOM}
        </div>
    );
};
