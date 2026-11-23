import React, { useEffect, useState } from 'react';

import { TableSelector } from 'components/AIAssistant/TableSelector';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ITextToSqlResult } from 'hooks/useAICommandSession';
import { Button } from 'ui/Button/Button';

interface IAICommandResultViewProps {
    metastoreId: number;
    originalQuery: string;
    tables: string[];
    hasMentionedTables: boolean;
    result: ITextToSqlResult;
    isStreaming: boolean;
    onContinue: () => void;
    onTablesChange: (tables: string[]) => void;
}

export const AICommandResultView = ({
    metastoreId,
    originalQuery,
    tables,
    hasMentionedTables,
    result,
    isStreaming,
    onContinue,
    onTablesChange,
}: IAICommandResultViewProps) => {
    const [foundTables, setFoundTables] = useState<boolean>(false);

    useEffect(() => {
        setFoundTables(result?.kind === 'tables');
    }, [result]);

    const newQuery = result?.kind === 'query' ? result.query : '';
    const explanation = result?.kind === 'query' ? result.explanation : '';

    const tablesDOM = (
        <div className="mt12">
            <div>Please review table(s) to use for the query</div>
            <TableSelector
                metastoreId={metastoreId}
                tableNames={tables}
                onTableNamesChange={(tables) => {
                    onTablesChange(tables);
                    setFoundTables(true);
                }}
            />
            {foundTables && tables.length > 0 && (
                <div className="mt12">
                    <Button
                        title="Continue"
                        onClick={onContinue}
                        color="accent"
                    />
                </div>
            )}
        </div>
    );

    const queryDiffDOM = (originalQuery || newQuery) && (
        <div className="mt12">
            <QueryComparison
                fromQuery={originalQuery}
                toQuery={newQuery}
                fromQueryTitle="Original Query"
                toQueryTitle="New Query"
                disableHighlight={isStreaming}
                hideEmptyQuery={true}
                autoHeight={true}
            />
        </div>
    );

    return (
        <div>
            {!hasMentionedTables && tablesDOM}
            {explanation && <div className="mt12">{explanation}</div>}
            {queryDiffDOM}
        </div>
    );
};
