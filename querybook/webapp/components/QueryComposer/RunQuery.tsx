import React from 'react';
import toast from 'react-hot-toast';

import { IQueryEngine } from 'const/queryEngine';
import { sendConfirm } from 'lib/querybookUI';
import { getDroppedTables } from 'lib/sql-helper/sql-checker';
import { getLimitedQuery } from 'lib/sql-helper/sql-limiter';
import { renderTemplatedQuery } from 'lib/templated-query';
import { Nullable } from 'lib/typescript';
import { formatError } from 'lib/utils/error';
import { Content } from 'ui/Content/Content';

export async function transformQuery(
    query: string,
    templatedVariables: Record<string, string>,
    engine: IQueryEngine,
    rowLimit: Nullable<number>
): Promise<string> {
    if (!query) {
        return '';
    }

    const templatizedQuery = await transformTemplatedQuery(
        query,
        templatedVariables,
        engine.id
    );

    if (!templatizedQuery) {
        return '';
    }

    const limitedQuery = transformLimitedQuery(
        templatizedQuery,
        rowLimit,
        engine
    );

    return limitedQuery;
}

export async function runQuery(
    query: string,
    engineId: number,
    createQueryExecution: (query: string, engineId: number) => Promise<number>
): Promise<number> {
    if (!query) {
        return null;
    }
    const runQuery = () => createQueryExecution(query, engineId);
    return confirmIfDroppingTablesThenRunQuery(runQuery, query);
}

async function transformTemplatedQuery(
    query: string,
    templatedVariables: Record<string, string>,
    engineId: number
) {
    try {
        return await renderTemplatedQuery(query, templatedVariables, engineId);
    } catch (e) {
        toast.error(
            <div>
                <p>Failed to templatize query. </p>
                <p>{formatError(e)}</p>
            </div>,
            {
                duration: 5000,
            }
        );
    }
}

function transformLimitedQuery(
    query: string,
    rowLimit: Nullable<number>,
    engine: IQueryEngine
) {
    return engine.feature_params?.row_limit && rowLimit != null
        ? getLimitedQuery(query, rowLimit, engine.language)
        : query;
}

async function confirmIfDroppingTablesThenRunQuery(
    runQuery: () => Promise<number>,
    query: string
) {
    const droppedTables = getDroppedTables(query);

    let queryId: number;
    if (droppedTables.length > 0) {
        queryId = await new Promise<number>((resolve, reject) => {
            sendConfirm({
                header: 'Dropping Tables?',
                message: (
                    <Content>
                        <div>Your query is going to drop</div>
                        <ul>
                            {droppedTables.map((t) => (
                                <li key={t}>{t}</li>
                            ))}
                        </ul>
                    </Content>
                ),
                onConfirm: () => runQuery().then(resolve, reject),
                onDismiss: () => resolve(null),
                confirmText: 'Continue Execution',
            });
        });
    } else {
        queryId = await runQuery();
    }

    return queryId;
}
