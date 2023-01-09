import { FieldArray, Formik } from 'formik';
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import {
    IDataColumn,
    IDataSchema,
    IDataTable,
    ITableSampleParams,
} from 'const/metastore';
import { useToggleState } from 'hooks/useToggleState';
import { format } from 'lib/sql-helper/sql-formatter';
import { isAxiosErrorWithMessage } from 'lib/utils/error';
import * as dataSourcesActions from 'redux/dataSources/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { TableSamplesResource } from 'resource/table';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';

import { DataTableViewSamplesTable } from './DataTableViewSamplesTable';
import {
    COMPARSION_OPS,
    COMPARSION_OPS_WITH_VALUE,
    ITableSamplesFormValues,
    tableSamplesFormValuesToParams,
} from './sampleQueryFormSchema';

import './DataTableViewSamples.scss';

export interface IDataTableViewSamplesProps {
    table: IDataTable;
    tableColumns: IDataColumn[];
    schema: IDataSchema;
}

export const DataTableViewSamples: React.FunctionComponent<
    IDataTableViewSamplesProps
> = ({ table, tableColumns, schema }) => {
    // Hide options such as where / order by
    const [showAdvancedOptions, _, toggleShowAdvancedOptions] =
        useToggleState(false);

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
        [dispatch, table.id]
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
            try {
                const { data: query } = await TableSamplesResource.getQuery(
                    tableId,
                    params
                );
                setRawSamplesQuery(format(query, language));
            } catch (error) {
                if (isAxiosErrorWithMessage(error)) {
                    const possibleErrorMessage = error?.response?.data?.error;
                    if (possibleErrorMessage) {
                        toast.error(
                            `Failed to generate query, reason: ${possibleErrorMessage}`
                        );
                    }
                }
            }
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
                    partition:
                        tablePartitions && tablePartitions.length > 0
                            ? tablePartitions[tablePartitions.length - 1]
                            : null,
                    where: [['', '=', '']] as [[string, string, string]],
                    order_by: null,
                    order_by_asc: true,
                }}
                onSubmit={(values) =>
                    createDataTableSamples(
                        table.id,
                        values.engineId,
                        tableSamplesFormValuesToParams(values)
                    )
                }
            >
                {({ submitForm, isSubmitting, values }) => {
                    const engineField = (
                        <SimpleField
                            label="Engine"
                            type="react-select"
                            name="engineId"
                            options={queryEngines.map((engine) => ({
                                value: engine.id,
                                label: engine.name,
                            }))}
                        />
                    );
                    const partitionField = (
                        <SimpleField
                            type="react-select"
                            name="partition"
                            options={tablePartitions}
                            withDeselect
                            className="ml16"
                        />
                    );

                    const whereClauseField = (
                        <FieldArray
                            name="where"
                            render={(arrayHelpers) => {
                                const whereDOM = values.where.map(
                                    (whereClause, idx) => (
                                        <div className="flex-row" key={idx}>
                                            <div
                                                style={{
                                                    flex: 3,
                                                }}
                                            >
                                                <SimpleField
                                                    label={'Where'}
                                                    type="react-select"
                                                    name={`where[${idx}][0]`}
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
                                                    name={`where[${idx}][1]`}
                                                    options={COMPARSION_OPS}
                                                />
                                            </div>
                                            <div style={{ flex: 5 }}>
                                                {COMPARSION_OPS_WITH_VALUE.includes(
                                                    whereClause[1]
                                                ) && (
                                                    <SimpleField
                                                        label=" "
                                                        type="input"
                                                        name={`where[${idx}][2]`}
                                                    />
                                                )}
                                            </div>
                                            <IconButton
                                                icon="X"
                                                onClick={() =>
                                                    arrayHelpers.remove(idx)
                                                }
                                                className="mt8"
                                            />
                                        </div>
                                    )
                                );

                                return (
                                    <>
                                        {whereDOM}
                                        <div className="center-align add-where-clause mt16">
                                            <Button
                                                title="New Where Clause"
                                                icon="Plus"
                                                onClick={() =>
                                                    arrayHelpers.push([
                                                        '',
                                                        '=',
                                                        '',
                                                    ])
                                                }
                                            />
                                        </div>
                                    </>
                                );
                            }}
                        />
                    );

                    const orderByField = (
                        <SimpleField
                            type="react-select"
                            name="order_by"
                            options={tableColumns.map((col) => col.name)}
                            withDeselect
                        />
                    );
                    const orderByAscOrDescField = values.order_by != null && (
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
                    );

                    const controlsField = (
                        <div className="DataTableViewSamples-button  flex-row">
                            <ToggleButton
                                checked={showAdvancedOptions}
                                onClick={toggleShowAdvancedOptions}
                                title={
                                    showAdvancedOptions
                                        ? 'Hide Advanced Options'
                                        : 'Show Advanced Options'
                                }
                            />
                            <AsyncButton
                                icon="Eye"
                                title="View Sample Query"
                                onClick={() =>
                                    getDataTableSamplesQuery(
                                        table.id,
                                        tableSamplesFormValuesToParams(values),
                                        queryEngines.find(
                                            (engine) =>
                                                values.engineId === engine.id
                                        )?.language
                                    )
                                }
                            />
                            <AsyncButton
                                icon="Play"
                                color="accent"
                                title="Generate Samples"
                                onClick={submitForm}
                                disabled={isSubmitting}
                            />
                        </div>
                    );

                    const formFields = showAdvancedOptions && (
                        <div className="DataTableViewSamples-form mb12">
                            <div className="DataTableViewSamples-top flex-row">
                                {engineField}
                                {partitionField}
                            </div>
                            <div className="DataTableViewSamples-mid">
                                {whereClauseField}
                            </div>
                            <div className="DataTableViewSamples-bottom">
                                <div className="flex-row">
                                    {orderByField}
                                    {orderByAscOrDescField}
                                </div>
                            </div>
                        </div>
                    );

                    return (
                        <div className="mb12">
                            {formFields}
                            {controlsField}
                        </div>
                    );
                }}
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
