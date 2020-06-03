import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as dataSourcesActions from 'redux/dataSources/action';

import {
    IDataTable,
    IDataTableSamples,
    IDataSchema,
    IDataColumn,
} from 'const/metastore';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Table } from 'ui/Table/Table';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Loading } from 'ui/Loading/Loading';
import { Select, makeSelectOptions } from 'ui/Select/Select';
import { Title } from 'ui/Title/Title';

import './DataTableViewSamples.scss';
import { ITableSampleParams } from 'redux/dataSources/types';
import { Formik } from 'formik';
import { SimpleField } from 'ui/FormikField/SimpleField';

export interface IDataTableViewSamplesProps {
    table: IDataTable;
    tableColumns: IDataColumn[];
    schema: IDataSchema;
}

const SamplesTableView: React.FunctionComponent<{
    samples: IDataTableSamples;
    numberOfRows?: number;
}> = ({ samples, numberOfRows }) => {
    const tableRows = samples.value || [];

    const rows = tableRows
        .slice(1)
        .map((row) =>
            row.map((value) =>
                typeof value === 'string' ? value : JSON.stringify(value)
            )
        );
    const columns = (tableRows[0] || []).map((column, index) => ({
        Header: column,
        accessor: String(index),
    }));
    if (numberOfRows != null) {
        rows.splice(numberOfRows);
    }

    const tableDOM = (
        <Table
            className="StatementResultTable force-scrollbar-x"
            rows={rows}
            cols={columns}
        />
    );

    return <div className="DataHubTableViewSamples">{tableDOM}</div>;
};

export const DataTableViewSamples: React.FunctionComponent<IDataTableViewSamplesProps> = ({
    table,
    tableColumns,
    schema,
}) => {
    const tablePartitions: string[] = useMemo(
        () => JSON.parse(table.latest_partitions ?? '[]'),
        [table.latest_partitions]
    );

    const dispatch: Dispatch = useDispatch();
    const { queryEngines, samples } = useSelector((state: IStoreState) => {
        const metastoreId = schema.metastore_id;
        return {
            queryEngines: Object.values(
                state.queryEngine.queryEngineById
            ).filter((engine) => engine.metastore_id === metastoreId),
            samples: state.dataSources.dataTablesSamplesById[table.id],
        };
    });
    const [isLoading, setIsLoading] = React.useState(false);

    const loadDataTableSamples = React.useCallback(
        async (tableId) => {
            setIsLoading(true);
            try {
                return await dispatch(
                    dataSourcesActions.fetchDataTableSamplesIfNeeded(tableId)
                );
            } finally {
                setIsLoading(false);
            }
        },
        [dispatch]
    );

    const createDataTableSamples = React.useCallback(
        async (tableId, engineId, params) => {
            try {
                setIsLoading(true);
                return await dispatch(
                    dataSourcesActions.createDataTableSamples(
                        tableId,
                        engineId,
                        params
                    )
                );
            } finally {
                setIsLoading(false);
            }
        },

        [dispatch]
    );

    React.useEffect(() => {
        // Try to load the data initially
        if (samples == null) {
            loadDataTableSamples(table.id);
        }
    }, [table]);

    const controlDOM = (
        <div className="samples-control">
            <Formik
                initialValues={{
                    engineId: queryEngines?.[0]?.id,
                    partition: null,
                    where: [null, '=', ''] as [string, string, string],
                    order_by: null,
                    order_by_asc: true,
                }}
                onSubmit={(values) => {
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

                    return createDataTableSamples(
                        table.id,
                        values.engineId,
                        sampleParams
                    );
                }}
            >
                {({ submitForm, isSubmitting, isValid, values }) => (
                    <div className="mb12">
                        <div className="DataTableViewSamples-top flex-row">
                            <SimpleField
                                stacked
                                label="Engine"
                                type="react-select"
                                name="engineId"
                                options={queryEngines.map((engine) => ({
                                    value: engine.id,
                                    label: engine.name,
                                }))}
                            />
                            <SimpleField
                                stacked
                                type="react-select"
                                name="partition"
                                options={tablePartitions}
                                withDeselect
                            />
                        </div>
                        <div className="DataTableViewSamples-mid">
                            <div style={{ flex: 3 }}>
                                <SimpleField
                                    stacked
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
                                {['=', '!='].includes(values.where[1]) && (
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
                                    stacked
                                    type="react-select"
                                    name="order_by"
                                    options={tableColumns.map(
                                        (col) => col.name
                                    )}
                                    withDeselect
                                />
                                <SimpleField
                                    stacked
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
                            </div>
                            <div className="DataTableViewSamples-button mb12">
                                <AsyncButton
                                    title="Generate Table Samples"
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

    const samplesTableDOM = isLoading ? (
        <Loading />
    ) : samples ? (
        <SamplesTableView samples={samples} />
    ) : (
        <div className="samples-not-found">
            Samples not found, Click 'Generate' to create samples.
        </div>
    );

    return (
        <div className="DataTableViewSamples">
            {controlDOM}
            {samplesTableDOM}
        </div>
    );
};
