import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import * as dataSourcesActions from 'redux/dataSources/action';

import { IDataTable, IDataTableSamples, IDataSchema } from 'const/metastore';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Table } from 'ui/Table/Table';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Loading } from 'ui/Loading/Loading';
import { Select, makeSelectOptions } from 'ui/Select/Select';
import { Title } from 'ui/Title/Title';

import './DataTableViewSamples.scss';

export interface IDataTableViewSamplesProps {
    table: IDataTable;
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
            freezeHeader={true}
            rows={rows}
            cols={columns}
        />
    );

    return <div className="DataHubTableViewSamples">{tableDOM}</div>;
};

export const DataTableViewSamples: React.FunctionComponent<IDataTableViewSamplesProps> = ({
    table,
    schema,
}) => {
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
    const [selectedQueryEngineId, setQueryEngine] = React.useState<number>(
        queryEngines.length ? queryEngines[0].id : null
    );
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
        async (tableId, engineId) => {
            try {
                setIsLoading(true);
                return await dispatch(
                    dataSourcesActions.createDataTableSamples(tableId, engineId)
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
            <div>
                <Title size={6}>Generate Table Samples</Title>
            </div>
            <div className="samples-control-controller">
                <Select
                    value={selectedQueryEngineId}
                    onChange={(event) =>
                        setQueryEngine(Number(event.target.value))
                    }
                    withDeselect
                >
                    {makeSelectOptions(
                        queryEngines.map((engine) => ({
                            key: engine.id,
                            value: engine.name,
                        }))
                    )}
                </Select>
                <AsyncButton
                    title="Generate"
                    onClick={() =>
                        createDataTableSamples(table.id, selectedQueryEngineId)
                    }
                    disabled={selectedQueryEngineId == null || isLoading}
                />
            </div>
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
