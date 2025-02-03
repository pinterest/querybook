import React from 'react';
import toast from 'react-hot-toast';

import { ISamplingTables, TDataDocMetaVariables } from 'const/datadoc';
import { IQueryEngine } from 'const/queryEngine';
import { sendConfirm } from 'lib/querybookUI';
import { getDroppedTables } from 'lib/sql-helper/sql-checker';
import {
    getLimitedQuery,
    hasQueryContainUnlimitedSelect,
} from 'lib/sql-helper/sql-limiter';
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

    const sampledQuery = await transformTableSamplingQuery(
        templatizedQuery,
        language,
        samplingTables,
        sampleRate
    );

    const limitedQuery = await transformLimitedQuery(
        sampledQuery,
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

async function transformLimitedQuery(
    query: string,
    rowLimit: Nullable<number>,
    engine: IQueryEngine
) {
    if (!engine.feature_params?.row_limit) {
        return query;
    }

    if (rowLimit != null && rowLimit >= 0) {
        return getLimitedQuery(query, rowLimit, engine.language);
    }

    // query is unlimited but engine has row limit feature turned on

    const unlimitedSelectQuery = hasQueryContainUnlimitedSelect(
        query,
        engine.language
    );

    if (!unlimitedSelectQuery) {
        return query;
    }

    // Show a warning modal to let user confirm what they are doing
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
            onConfirm: () => resolve(query),
            onDismiss: () => reject(),
            confirmText: 'Run without LIMIT',
        });
    });
}

async function transformTableSamplingQuery(
    query: string,
    language: string,
    tables: Record<string, { sampled_table?: string; sample_rate?: number }>,
    sampleRate: Nullable<number>
) {
    if (sampleRate == null || sampleRate <= 0) {
        return query;
    }

    const { data } = await QueryTransformResource.getSampledQuery(
        query,
        language,
        tables
    );
    return data;
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
