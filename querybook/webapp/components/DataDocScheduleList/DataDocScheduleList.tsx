import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch, IStoreState } from 'redux/store/types';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Table } from 'ui/Table/Table';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { NextRun } from './NextRun';
import { DataDocScheduleActionButtons } from './DataDocScheduleActionButtons';
import { DataDocName } from './DataDocName';
import { HumanReadableCronSchedule } from './HumanReadableCronSchedule';
import { LastRecord } from './LastRecord';
import { LastRun } from './LastRun';
import { setCollapsed } from 'redux/querybookUI/action';

import { get } from 'lodash';

import './DataDocScheduleList.scss';

const DataDocScheduleList: React.FC = () => {
    const dispatch: Dispatch = useDispatch();
    const environment = useSelector(currentEnvironmentSelector);
    const dataDocs = useSelector((state: IStoreState) => state.scheduledDocs);
    const collapsed: boolean = useSelector(
        (state: IStoreState) => state.querybookUI.isEnvCollapsed
    );

    useEffect(() => {
        // or better option is to add two actions and move it to reducer?
        const restoredValue = collapsed;
        dispatch(setCollapsed(true));

        return () => {
            dispatch(setCollapsed(restoredValue));
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
                            <DataDocName
                                data={data.value}
                                environment={environment}
                            />
                        ),
                    },
                    {
                        Header: 'Schedule',
                        sortable: false,
                        accessor: 'schedule.cron',
                        Cell: (data) => (
                            <HumanReadableCronSchedule cron={data.value} />
                        ),
                    },
                    {
                        width: 200,
                        Header: 'Last Run',
                        sortable: false,
                        accessor: 'last_record.created_at',
                        Cell: (data) => <LastRun createdAt={data.value} />,
                    },
                    {
                        Header: 'Next Run',
                        width: 200,
                        sortable: false,
                        accessor: 'schedule.cron',
                        Cell: (data) => <NextRun cron={data.value} />,
                    },
                    {
                        Header: 'Execution Time',
                        width: 200,
                        sortable: false,
                        accessor: 'last_record',
                        Cell: (data) => <LastRecord recordDates={data.value} />,
                    },
                    {
                        Header: 'Status',
                        maxWidth: 150,
                        sortable: false,
                        accessor: 'last_record',
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
                        Cell: (data) => (
                            <DataDocScheduleActionButtons docId={data.value} />
                        ),
                    },
                ]}
                manual
                defaultPageSize={10}
                onFetchData={({ page, pageSize, filtered }) => {
                    dispatch(
                        getScheduledDocs({
                            paginationPage: page,
                            paginationPageSize: pageSize,
                            paginationFilter: get(filtered, '[0].value', ''),
                        })
                    );
                }}
                pages={dataDocs.totalPages}
            />
        </FullHeight>
    );
};

export default DataDocScheduleList;
