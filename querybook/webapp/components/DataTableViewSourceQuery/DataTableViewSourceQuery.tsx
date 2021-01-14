import React, { useState, useMemo } from 'react';

import {
    IDataTable,
    IDataJobMetadata,
    ILineageCollection,
} from 'const/metastore';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Loading } from 'ui/Loading/Loading';
import { Table } from 'ui/Table/Table';
import { CodeHighlight } from 'ui/CodeHighlight/CodeHighlight';
import { Title } from 'ui/Title/Title';

import { getCodeEditorTheme } from 'lib/utils';
import { IStoreState } from 'redux/store/types';
import { useSelector } from 'react-redux';
import { Divider } from 'ui/Divider/Divider';
import { Button } from 'ui/Button/Button';
import { Link } from 'ui/Link/Link';
import './DataTableViewSourceQuery.scss';

const dataJobMetadataTableColumns = ['name', 'value'];

export interface IProps {
    table: IDataTable;
    dataJobMetadataById: Record<number, IDataJobMetadata>;
    dataLineages: ILineageCollection;

    loadDataJobMetadata: (id: number) => any;
}

export const DataTableViewSourceQuery: React.FunctionComponent<IProps> = ({
    dataLineages,
    table,
    loadDataJobMetadata,
    dataJobMetadataById,
}) => {
    const [showOldJobMetadata, setShowOldJobMetadata] = useState(false);

    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    const jobMetadataIds = useMemo(
        () =>
            Array.from(
                (dataLineages.parentLineage[table.id] || []).reduce(
                    (set, lineage) => {
                        set.add(lineage.job_metadata_id);
                        return set;
                    },
                    new Set<number>()
                )
            ),
        [dataLineages.parentLineage, table.id]
    );

    const jobMetadataIdsOrderedAndLoaded = React.useMemo(() => {
        let orderedIds = [...jobMetadataIds].sort((a, b) => b - a);

        if (!showOldJobMetadata) {
            // Only show the most recent definition
            orderedIds = orderedIds.slice(0, 1);
        }

        return orderedIds.filter((parentTableId) => {
            const found = parentTableId in dataJobMetadataById;
            if (!found) {
                loadDataJobMetadata(parentTableId);
            }
            return found;
        });
    }, [
        jobMetadataIds,
        loadDataJobMetadata,
        dataJobMetadataById,
        showOldJobMetadata,
    ]);

    const parentDOM = jobMetadataIdsOrderedAndLoaded.map((id) => {
        const loaded = !(dataJobMetadataById[id] as any).__loading;
        const dataJobMetadata = dataJobMetadataById[id];
        return loaded ? (
            <DataJobMetadataInfo
                key={id}
                editorTheme={editorTheme}
                dataJobMetadata={dataJobMetadata}
            />
        ) : (
            <Loading key={id} />
        );
    });

    const errorDOM =
        jobMetadataIds.length > 0 ? null : (
            <div>The source query for this table is not available.</div>
        );

    const showMoreDOM =
        !showOldJobMetadata && jobMetadataIds.length > 1 ? (
            <div className="center-align">
                <Button
                    title="Show Previous Source Query"
                    onClick={() => setShowOldJobMetadata(true)}
                />
            </div>
        ) : null;

    return (
        <div className="DataTableViewSourceQuery">
            {parentDOM}
            {errorDOM}
            {showMoreDOM}
        </div>
    );
};

const DataJobMetadataInfo: React.FC<{
    dataJobMetadata: IDataJobMetadata;
    editorTheme: string;
}> = ({ dataJobMetadata, editorTheme }) => {
    const queryExecutionUrlRows = [];
    if (
        dataJobMetadata.is_adhoc &&
        'query_execution_id' in dataJobMetadata.job_info
    ) {
        const queryExecutionId = dataJobMetadata.job_info['query_execution_id'];
        queryExecutionUrlRows.push({
            name: `Created in Querybook`,
            value: (
                <Link
                    to={{
                        pathname: getWithinEnvUrl(
                            `/query_execution/${queryExecutionId}/`
                        ),
                        state: {
                            isModal: true,
                        },
                    }}
                >
                    Click here to view the execution
                </Link>
            ),
        });
    }

    const rows = queryExecutionUrlRows
        .concat([
            {
                name: 'Job Name',
                value: dataJobMetadata.job_name,
            },
            {
                name: 'Job Owner',
                value: dataJobMetadata.job_owner,
            },
        ])
        .concat(
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
        <div className="mb16">
            {tableDOM}
            {queryDOM}
        </div>
    );
};
