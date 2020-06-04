import React from 'react';

import {
    IDataTable,
    IDataJobMetadata,
    ILineageCollection,
} from 'const/metastore';
import { Loading } from 'ui/Loading/Loading';
import { Table } from 'ui/Table/Table';
import { CodeHighlight } from 'ui/CodeHighlight/CodeHighlight';
import { Title } from 'ui/Title/Title';

import './DataTableViewSourceQuery.scss';
import { getCodeEditorTheme } from 'lib/utils';
import { IStoreState } from 'redux/store/types';
import { useSelector } from 'react-redux';
import { Divider } from 'ui/Divider/Divider';

const dataJobMetadataTableColumns = ['name', 'value'];

export interface IProps {
    table: IDataTable;
    dataJobMetadataById: Record<number, IDataJobMetadata>;
    dataLineages: ILineageCollection;

    loadDataJobMetadata: (id: number) => any;
}

export interface IState {
    parentTableIds: number[];
}

export const DataTableViewSourceQuery: React.FunctionComponent<IProps> = ({
    dataLineages,
    table,
    loadDataJobMetadata,
    dataJobMetadataById,
}) => {
    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    const parentTableIds = React.useMemo(() => {
        const rawParentTableIds: number[] = Array.from(
            (dataLineages.parentLineage[table.id] || []).reduce(
                (set, lineage) => {
                    set.add(lineage.job_metadata_id);
                    return set;
                },
                new Set<number>()
            )
        );

        return rawParentTableIds.filter((parentTableId) => {
            const found = parentTableId in dataJobMetadataById;
            if (!found) {
                loadDataJobMetadata(parentTableId);
            }
            return found;
        });
    }, [
        dataLineages.parentLineage,
        table.id,
        loadDataJobMetadata,
        dataJobMetadataById,
    ]);

    const makeDataJobMetadataInfoDOM = (dataJobMetadata: IDataJobMetadata) => {
        const rows = [
            {
                name: 'job_name',
                value: dataJobMetadata.job_name,
            },
            {
                name: 'job_owner',
                value: dataJobMetadata.job_owner,
            },
        ].concat(
            Object.entries(dataJobMetadata.job_info).map(([name, value]) => ({
                name,
                value,
            }))
        );
        const tableDOM = (
            <div className="DataTableViewSourceQuery-table">
                <div className="data-job-metadata-top">
                    <Title size={5}>Meta Data Job</Title>
                    <Divider marginTop="4px" marginBottom="12px" />
                </div>
                <Table
                    className="data-table-details-table"
                    showHeader={false}
                    showAllRows={true}
                    rows={rows}
                    cols={dataJobMetadataTableColumns}
                />
            </div>
        );

        let { query_text: queryText = '' } = dataJobMetadata;

        // We want to convert a quoted string into an unquoted string
        if (queryText[0] === '"' && queryText[queryText.length - 1] === '"') {
            queryText = JSON.parse(queryText);
        }

        const queryDOM = (
            <div className="DataTableViewSourceQuery-source-query">
                <div className="data-job-source-query-top">
                    <Title size={5}>Source Query</Title>
                    <Divider marginTop="4px" marginBottom="12px" />
                </div>
                <CodeHighlight
                    language={'text/x-hive'}
                    value={queryText}
                    theme={editorTheme}
                />
            </div>
        );

        return (
            <>
                {tableDOM}
                {queryDOM}
            </>
        );
    };

    const parentDOM = parentTableIds.map((id) => {
        const loaded = !(dataJobMetadataById[id] as any).__loading;
        const dataJobMetadata = dataJobMetadataById[id];
        return (
            <>
                {loaded ? (
                    makeDataJobMetadataInfoDOM(dataJobMetadata)
                ) : (
                    <Loading />
                )}
            </>
        );
    });

    const errorDOM =
        parentTableIds.length > 0 ? null : (
            <div>The source query for this table is not available.</div>
        );

    return (
        <div className="DataTableViewSourceQuery">
            {parentDOM}
            {errorDOM}
        </div>
    );
};
