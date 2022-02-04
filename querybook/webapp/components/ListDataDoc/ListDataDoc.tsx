import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Table } from 'ui/Table/Table';
import * as dataDocActions from 'redux/dataDoc/action';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { NextRun } from './components/NextRun';
import { ActiveButtons } from './components/ActiveButtons';
import { DataDocsName } from './components/DataDocsName';
import { DataDocSchedule } from './components/DataDocSchedule';
import { LastRecord } from './components/LastRecord';
import { LastRun } from './components/LastRun';
import { setCollapsed } from 'redux/environment/action';

import './ListDataDoc.scss';

const ListDataDoc: React.FC = () => {
    const dispatch: Dispatch = useDispatch();
    const env = useSelector((state: IStoreState) => {
        const { currentEnvironmentId, environmentById } = state.environment;
        return environmentById[currentEnvironmentId];
    });
    const dataDocs = useSelector(
        (state: IStoreState) => state.dataDoc.dataDocWithSchema
    );
    useEffect(() => {
        dispatch(setCollapsed(true));

        return () => {
            dispatch(setCollapsed(false));
        };
    }, []);

    return (
        <FullHeight flex={'column'} className="ListDataTable">
            <Table
                rows={dataDocs.docs}
                cols={[
                    {
                        filterable: true,
                        sortable: false,
                        accessor: 'doc',
                        Header: 'DataDoc',
                        Cell: (data) => (
                            <DataDocsName data={data.value} env={env} />
                        ),
                    },
                    {
                        width: 300,
                        Header: 'Schedule (UTC)',
                        sortable: false,
                        accessor: 'schedule.cron',
                        Cell: (data) => <DataDocSchedule cron={data.value} />,
                    },
                    {
                        width: 200,
                        Header: 'Last Run (UTC)',
                        sortable: false,
                        accessor: 'lastRecord.created_at',
                        Cell: (data) => <LastRun createdAt={data.value} />,
                    },
                    {
                        Header: 'Next Run (UTC)',
                        width: 200,
                        sortable: false,
                        accessor: 'schedule.cron',
                        Cell: (data) => <NextRun cron={data.value} />,
                    },
                    {
                        Header: 'Execution Time',
                        width: 200,
                        sortable: false,
                        accessor: 'lastRecord',
                        Cell: (data) => <LastRecord value={data.value} />,
                    },
                    {
                        Header: 'Status',
                        maxWidth: 150,
                        sortable: false,
                        accessor: 'lastRecord',
                        Cell: ({ value }) => {
                            if (!value) {
                                return <div>No History</div>;
                            }
                            return <TaskStatusIcon type={value.status} />;
                        },
                    },
                    {
                        Header: 'Actions',
                        sortable: false,
                        maxWidth: 150,
                        accessor: 'doc.id',
                        Cell: (data) => <ActiveButtons docId={data.value} />,
                    },
                ]}
                manual
                defaultPageSize={10}
                onFetchData={({ page, pageSize, filtered }) => {
                    dispatch(
                        dataDocActions.getDataDocWithSchema({
                            paginationPage: page,
                            paginationPageSize: pageSize,
                            paginationFilter: filtered,
                        })
                    );
                }}
                pages={dataDocs.total}
            />
        </FullHeight>
    );
};

export default ListDataDoc;
