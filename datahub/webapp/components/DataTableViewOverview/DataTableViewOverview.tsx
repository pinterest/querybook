import { bind } from 'lodash-decorators';
import React from 'react';
import {
    IDataTable,
    IDataColumn,
    IDataTableWarning,
    DataTableWarningSeverity,
} from 'const/metastore';
import * as DraftJs from 'draft-js';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { generateFormattedDate } from 'lib/utils/datetime';
import { titleize, getHumanReadableByteSize } from 'lib/utils';

import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Table } from 'ui/Table/Table';
import { Title } from 'ui/Title/Title';
import { Divider } from 'ui/Divider/Divider';

import './DataTableViewOverview.scss';
import { Message } from 'ui/Message/Message';

const dataTableDetailsColumns = [
    {
        accessor: 'name',
        width: 200,
    },
    { accessor: 'value' },
];

const dataTableDetailsRows = [
    'type',
    'owner',
    'table_created_at',
    'table_updated_by',
    'table_updated_at',
    'data_size_bytes',
    'latest_partitions',
    'earliest_partitions',
    'location',
    'column_count',
];

export interface IDataHubTableViewOverviewProps {
    table: IDataTable;
    tableName: string;
    tableColumns: IDataColumn[];
    tableWarnings: IDataTableWarning[];

    onTabSelected: (key: string) => any;
    updateDataTableDescription: (
        tableId: number,
        description: DraftJs.ContentState
    ) => any;
}

export class DataTableViewOverview extends React.PureComponent<
    IDataHubTableViewOverviewProps
> {
    @bind
    public onDescriptionSave(description: DraftJs.ContentState) {
        const table = this.props.table;
        return this.props.updateDataTableDescription(table.id, description);
    }

    @bind
    public makeOverviewSectionDOM(
        title: React.ReactNode,
        content?: React.ReactNode,
        footer?: React.ReactNode
    ) {
        return (
            <div>
                <div className="overview-section-top">
                    <Title size={5}>{title}</Title>
                    <Divider marginTop="4px" marginBottom="12px" />
                </div>
                <div className="overview-section-content">{content}</div>
                <div className="overview-section-footer">{footer}</div>
                <br />
            </div>
        );
    }

    public render() {
        const { table, tableName, tableWarnings } = this.props;
        const description = table.description ? (
            <EditableTextField
                value={table.description as DraftJs.ContentState}
                onSave={this.onDescriptionSave}
            />
        ) : null;

        const detailsDOM = (
            <Table
                className="data-table-details-table"
                showHeader={false}
                rows={dataTableDetailsRows.map((row) => {
                    let value: string = '';
                    switch (row) {
                        case 'table_created_at':
                        case 'table_updated_at': {
                            value = table[row]
                                ? generateFormattedDate(table[row])
                                : '';
                            break;
                        }
                        case 'data_size_bytes': {
                            value = getHumanReadableByteSize(table[row]);
                            break;
                        }
                        default:
                            value = table[row];
                    }
                    return {
                        name: titleize(row, '_', ' '),
                        value,
                    };
                })}
                showAllRows={true}
                cols={dataTableDetailsColumns}
            />
        );
        const hiveMetastoreDOM = (
            <pre>{table.hive_metastore_description || ''}</pre>
        );

        const descriptionSection = this.makeOverviewSectionDOM(
            `Description`,
            description,
            null
        );
        const metaSection = this.makeOverviewSectionDOM(
            'Meta info',
            <div>
                <p>
                    First created in DataHub at{' '}
                    {generateFormattedDate(table.created_at)}
                </p>
                <p>
                    Last pulled from metastore at{' '}
                    {generateFormattedDate(table.updated_at)}
                </p>
            </div>
        );

        const detailsSection = this.makeOverviewSectionDOM(
            `Details`,
            detailsDOM
        );

        const hiveMetastoreSection = this.makeOverviewSectionDOM(
            `Hive Metastore Raw`,
            hiveMetastoreDOM
        );

        const sampleQueriesSection = this.makeOverviewSectionDOM(
            `Sample DataDocs`,
            <a
                onClick={() =>
                    navigateWithinEnv(
                        `/search/?searchType=DataDoc&searchString=${tableName}`,
                        {
                            isModal: true,
                        }
                    )
                }
            >
                See Sample DataDocs.
            </a>
        );

        const warningSection = tableWarnings.length
            ? this.makeOverviewSectionDOM(
                  `User Warnings`,
                  <>
                      {tableWarnings.map((warning) => {
                          const isError =
                              warning.severity ===
                              DataTableWarningSeverity.ERROR;
                          return (
                              <Message
                                  key={warning.id}
                                  title={isError ? 'Error' : 'Warning'}
                                  message={warning.message}
                                  type={isError ? 'error' : 'warning'}
                              />
                          );
                      })}
                  </>
              )
            : null;

        return (
            <div className="DataHubTableViewOverview">
                {warningSection}
                {descriptionSection}
                {metaSection}
                {detailsSection}
                {hiveMetastoreSection}
                {sampleQueriesSection}
            </div>
        );
    }
}
