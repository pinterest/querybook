import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FieldArray, Formik } from 'formik';
import toast from 'react-hot-toast';

import * as dataSourcesActions from 'redux/dataSources/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { format } from 'lib/sql-helper/sql-formatter';
import { isAxiosError } from 'lib/utils/error';

import {
    IDataTable,
    IDataSchema,
    IDataColumn,
    ITableSampleParams,
} from 'const/metastore';
import { TableSamplesResource } from 'resource/table';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';

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
                if (isAxiosError(error)) {
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
                    partition: null,
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
                {({ submitForm, isSubmitting, values }) => (
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
                                                <div>
                                                    <IconButton
                                                        icon="x"
                                                        onClick={() =>
                                                            arrayHelpers.remove(
                                                                idx
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )
                                    );

                                    return (
                                        <>
                                            {whereDOM}
                                            <div className="center-align add-where-clause">
                                                <SoftButton
                                                    size="small"
                                                    title="Add Where Clause"
                                                    icon="plus"
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
                                            tableSamplesFormValuesToParams(
                                                values
                                            ),
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
