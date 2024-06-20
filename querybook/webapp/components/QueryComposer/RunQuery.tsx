import React from 'react';
import toast from 'react-hot-toast';

import { ISamplingTables, TDataDocMetaVariables } from 'const/datadoc';
import { IQueryEngine } from 'const/queryEngine';
import { sendConfirm } from 'lib/querybookUI';
import { getDroppedTables } from 'lib/sql-helper/sql-checker';
import { renderTemplatedQuery } from 'lib/templated-query';
import { Nullable } from 'lib/typescript';
import { formatError } from 'lib/utils/error';
import { QueryTransformResource } from 'resource/queryTransform';
import { Content } from 'ui/Content/Content';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';

export async function transformQuery(
    query: string,
    language: string,
    templatedVariables: TDataDocMetaVariables,
    engine: IQueryEngine,
    rowLimit: Nullable<number>,
    samplingTables: ISamplingTables,
    sampleRate: Nullable<number>
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

    const rowLimitEnabled = engine.feature_params?.row_limit ?? false;

    const { data } = await QueryTransformResource.getTransformedQuery(
        query,
        language,
        rowLimitEnabled ? rowLimit ?? -1 : -1,
        sampleRate === 0 ? null : samplingTables
    );

    const { query: transformedQuery, unlimited_select: unlimitedSelectQuery } =
        data;

    if (!unlimitedSelectQuery || !rowLimitEnabled) {
        return transformedQuery;
    }

    // Show a warning modal if the query is unbounded to let user confirm what they are doing
    return new Promise<string>((resolve, reject) => {
        sendConfirm({
            header: 'Your SELECT query is unbounded',
            message: (
                <Content>
                    <div>
                        The following SELECT statement has no limit. Please make
                        sure you intend to get all the rows returned.
                    </div>
                    <div>
                        <i>
                            Tip: to avoid seeing this message, add a LIMIT in
                            the query or set a limit value on the left of the
                            run button.
                        </i>
                    </div>
                    <pre>
                        <code>
                            <ShowMoreText text={unlimitedSelectQuery} />
                        </code>
                    </pre>
                </Content>
            ),
            onConfirm: () => resolve(transformedQuery),
            onDismiss: () => reject(),
            confirmText: 'Run without LIMIT',
        });
    });
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
    templatedVariables: TDataDocMetaVariables,
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
                onDismiss: reject,
                confirmText: 'DROP the table',
            });
        });
    } else {
        queryId = await runQuery();
    }

    return queryId;
}
