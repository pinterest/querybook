import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';

import * as dataSourcesActions from 'redux/dataSources/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import ds from 'lib/datasource';
import { format } from 'lib/sql-helper/sql-formatter';
import { downloadString } from 'lib/utils';
import { tableToCSV, tableToTSV } from 'lib/utils/table-export';

import {
    IDataTable,
    IDataTableSamples,
    IDataSchema,
    IDataColumn,
} from 'const/metastore';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

import { Loading } from 'ui/Loading/Loading';

import { ITableSampleParams } from 'redux/dataSources/types';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { useInterval } from 'hooks/useInterval';
import { ProgressBar } from 'ui/ProgressBar/ProgressBar';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { StatementResultTable } from 'components/DataDocStatementExecution/StatementResultTable';
import { Button } from 'ui/Button/Button';
import { CopyButton } from 'ui/CopyButton/CopyButton';

import './DataTableViewSamples.scss';

export interface IDataTableViewSamplesProps {
    table: IDataTable;
    tableColumns: IDataColumn[];
    schema: IDataSchema;
}

const SamplesTableView: React.FunctionComponent<{
    samples: IDataTableSamples;
    tableName: string;
    numberOfRows?: number;
}> = ({ samples, numberOfRows, tableName }) => {
    const processedData: string[][] = useMemo(
        () =>
            samples?.value.map((row) =>
                row.map((value) =>
                    typeof value === 'string'
                        ? value
                        : value?._isBigNumber || typeof value === 'number'
                        ? value.toString()
                        : // this is for functions, objects and arrays
                          JSON.stringify(value)
                )
            ),
        [samples?.value]
    );

    const tableDOM = (
        <StatementResultTable
            data={processedData}
            paginate={true}
            maxNumberOfRowsToShow={numberOfRows}
        />
    );

    return (
        <div className="QuerybookTableViewSamples">
            <div className="flex-row">
                <Button
                    title="Download as csv"
                    onClick={() => {
                        downloadString(
                            tableToCSV(processedData),
                            `${tableName}_samples.csv`,
                            'text/csv'
                        );
                    }}
                    icon="download"
                    type="inlineText"
                    borderless
                    small
                />
                <span className="mr8" />
                <CopyButton
                    title="Copy as tsv"
                    copyText={() => tableToTSV(processedData)}
                    type="inlineText"
                    borderless
                    small
                />
            </div>

            {tableDOM}
        </div>
    );
};

interface ITableSamplesFormValues {
    engineId: number;
    partition?: string;
    where: [string | null, string, string];
    order_by?: string;
    order_by_asc: boolean;
}

function valuesToParams(values: ITableSamplesFormValues) {
    const sampleParams: ITableSampleParams = {};
    if (values.partition) {
        sampleParams.partition = values.partition;
    }
    if (values.order_by) {
        sampleParams.order_by = values.order_by;
    }
    sampleParams.order_by_asc = values.order_by_asc;

    if (values.where[0]) {
        sampleParams.where = values.where;
    }
    return sampleParams;
}

export const DataTableViewSamples: React.FunctionComponent<IDataTableViewSamplesProps> = ({
    table,
    tableColumns,
    schema,
}) => {
    // Used to display the raw query that will be used for samples
    // only shown if view query is clicked
    const [rawSamplesQuery, setRawSamplesQuery] = useState<string>(null);
    const tablePartitions: string[] = useMemo(
        () => JSON.parse(table.latest_partitions ?? '[]'),
        [table.latest_partitions]
    );

    const dispatch: Dispatch = useDispatch();
    const queryEngines = useSelector((state: IStoreState) => {
        const queryEngineIds =
            state.environment.environmentEngineIds[
                state.environment.currentEnvironmentId
            ] ?? [];
        return queryEngineIds
            .map((engineId) => state.queryEngine.queryEngineById[engineId])
            .filter((engine) => engine?.metastore_id === schema.metastore_id);
    });

    const loadDataTableSamples = React.useCallback(
        async () =>
            dispatch(
                dataSourcesActions.fetchDataTableSamplesIfNeeded(table.id)
            ),
        [table.id]
    );

    const createDataTableSamples = React.useCallback(
        async (tableId, engineId, params?: ITableSampleParams) =>
            dispatch(
                dataSourcesActions.createDataTableSamples(
                    tableId,
                    engineId,
                    params
                )
            ),
        []
    );

    const getDataTableSamplesQuery = React.useCallback(
        async (tableId, params: ITableSampleParams, language: string) => {
            const { data: query } = await ds.fetch<string>(
                `/table/${tableId}/raw_samples_query/`,
                params as Record<string, any>
            );
            setRawSamplesQuery(format(query, language));
        },
        []
    );

    const pollDataTableSamples = React.useCallback(
        () => dispatch(dataSourcesActions.pollDataTableSample(table.id)),
        [table.id]
    );

    const controlDOM = (
        <div className="samples-control">
            <Formik<ITableSamplesFormValues>
                initialValues={{
                    engineId: queryEngines?.[0]?.id,
                    partition: null,
                    where: [null, '=', ''] as [string, string, string],
                    order_by: null,
                    order_by_asc: true,
                }}
                onSubmit={(values) =>
                    createDataTableSamples(
                        table.id,
                        values.engineId,
                        valuesToParams(values)
                    )
                }
            >
                {({ submitForm, isSubmitting, isValid, values }) => (
                    <div className="mb12">
                        <div className="DataTableViewSamples-top flex-row">
                            <SimpleField
                                label="Engine"
                                type="react-select"
                                name="engineId"
                                options={queryEngines.map((engine) => ({
                                    value: engine.id,
                                    label: engine.name,
                                }))}
                            />
                            <SimpleField
                                type="react-select"
                                name="partition"
                                options={tablePartitions}
                                withDeselect
                            />
                        </div>
                        <div className="DataTableViewSamples-mid">
                            <div style={{ flex: 3 }}>
                                <SimpleField
                                    label="Where"
                                    type="react-select"
                                    name="where[0]"
                                    options={tableColumns.map(
                                        (col) => col.name
                                    )}
                                    withDeselect
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <SimpleField
                                    label=" "
                                    type="select"
                                    name="where[1]"
                                    options={[
                                        '=',
                                        '!=',
                                        'LIKE',
                                        'IS NULL',
                                        'IS NOT NULL',
                                    ]}
                                />
                            </div>
                            <div style={{ flex: 5 }}>
                                {['=', '!=', 'LIKE'].includes(
                                    values.where[1]
                                ) && (
                                    <SimpleField
                                        label=" "
                                        type="input"
                                        name="where[2]"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="DataTableViewSamples-bottom">
                            <div className="flex-row">
                                <SimpleField
                                    type="react-select"
                                    name="order_by"
                                    options={tableColumns.map(
                                        (col) => col.name
                                    )}
                                    withDeselect
                                />
                                {values.order_by != null && (
                                    <SimpleField
                                        label="Order"
                                        type="react-select"
                                        name="order_by_asc"
                                        options={[
                                            {
                                                label: 'Ascending',
                                                value: true,
                                            },
                                            {
                                                label: 'Descending',
                                                value: false,
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                            <div className="DataTableViewSamples-button mb8">
                                <AsyncButton
                                    title="View Query"
                                    onClick={() =>
                                        getDataTableSamplesQuery(
                                            table.id,
                                            valuesToParams(values),
                                            queryEngines.find(
                                                (engine) =>
                                                    values.engineId ===
                                                    engine.id
                                            )?.language
                                        )
                                    }
                                />
                                <AsyncButton
                                    title="Generate Samples"
                                    onClick={submitForm}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Formik>
        </div>
    );

    return (
        <div className="DataTableViewSamples">
            {controlDOM}
            <DataTableViewSamplesTable
                tableId={table.id}
                tableName={table.name}
                loadDataTableSamples={loadDataTableSamples}
                pollDataTableSamples={pollDataTableSamples}
            />
            {rawSamplesQuery != null && (
                <CopyPasteModal
                    text={rawSamplesQuery}
                    displayText
                    onHide={() => setRawSamplesQuery(null)}
                />
            )}
        </div>
    );
};

const DataTableViewSamplesTable: React.FC<{
    tableId: number;
    tableName: string;
    loadDataTableSamples: () => Promise<any>;
    pollDataTableSamples: () => Promise<any>;
}> = ({ tableId, loadDataTableSamples, pollDataTableSamples, tableName }) => {
    const [loading, setLoading] = useState(false);

    const samples = useSelector(
        (state: IStoreState) => state.dataSources.dataTablesSamplesById[tableId]
    );
    const poll = useSelector(
        (state: IStoreState) =>
            state.dataSources.dataTablesSamplesPollingById[tableId]
    );

    React.useEffect(() => {
        // Try to load the data initially
        if (samples == null) {
            setLoading(true);
            loadDataTableSamples().finally(() => setLoading(false));
        }
    }, [tableId]);

    useInterval(
        () => {
            pollDataTableSamples();
        },
        1000,
        !poll
    );

    const samplesTableDOM = loading ? (
        <Loading />
    ) : poll ? (
        <div className="center-align p12">
            <ProgressBar value={poll.progress} showValue />
        </div>
    ) : samples ? (
        <SamplesTableView tableName={tableName} samples={samples} />
    ) : (
        <div className="samples-not-found">
            Samples not found, Click "Generate" to create samples.
        </div>
    );

    return samplesTableDOM;
};
