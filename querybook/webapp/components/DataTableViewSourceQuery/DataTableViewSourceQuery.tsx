import React, { useMemo, useState } from 'react';

import {
    IDataJobMetadata,
    IDataTable,
    ILineageCollection,
} from 'const/metastore';
import { isValidUrl } from 'lib/utils';
import { getAppName } from 'lib/utils/global';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Button } from 'ui/Button/Button';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Link } from 'ui/Link/Link';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';
import { Table } from 'ui/Table/Table';
import { Title } from 'ui/Title/Title';

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
            <DataJobMetadataInfo key={id} dataJobMetadata={dataJobMetadata} />
        ) : (
            <Loading key={id} />
        );
    });

    const customProperties = table.custom_properties ?? {};
    const workflowValue = customProperties['workflow'];
    const workflowDOM =
        workflowValue && typeof workflowValue === 'string' ? (
            <div className="DataTableViewSourceQuery-workflow">
                <div className="data-table-workflow">
                    <Title size="med" className="mb12">
                        Workflow
                    </Title>
                </div>
                {isValidUrl(workflowValue) ? (
                    <Link to={workflowValue} newTab>
                        {workflowValue}
                    </Link>
                ) : (
                    workflowValue
                )}
            </div>
        ) : null;

    const errorDOM =
        jobMetadataIds.length > 0 ? null : (
            <EmptyText className="m24">
                The source query is not available
            </EmptyText>
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
            {workflowDOM}
            {parentDOM}
            {errorDOM}
            {showMoreDOM}
        </div>
    );
};

const DataJobMetadataInfo: React.FC<{
    dataJobMetadata: IDataJobMetadata;
}> = ({ dataJobMetadata }) => {
    const queryExecutionUrlRows = [];
    if (
        dataJobMetadata.is_adhoc &&
        'query_execution_id' in dataJobMetadata.job_info
    ) {
        const queryExecutionId = dataJobMetadata.job_info['query_execution_id'];
        queryExecutionUrlRows.push({
            name: `Created in ${getAppName()}`,
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
                <Title size="med" className="mb12">
                    Meta Data Job
                </Title>
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
        <div className="DataTableViewSourceQuery-source-query mt16">
            <div className="data-job-source-query-top">
                <Title size="med" className="mb12">
                    Source Query
                </Title>
            </div>
            <ThemedCodeHighlight value={queryText} />
        </div>
    );

    return (
        <div className="mb16">
            {tableDOM}
            {queryDOM}
        </div>
    );
};
