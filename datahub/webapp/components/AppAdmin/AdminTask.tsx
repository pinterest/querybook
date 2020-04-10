import * as React from 'react';
import moment from 'moment';

import ds from 'lib/datasource';
import history from 'lib/router-history';
import { generateFormattedDate } from 'lib/utils/datetime';
import { useDataFetch } from 'hooks/useDataFetch';
import { Table, TableAlign } from 'ui/Table/Table';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import './AdminTask.scss';
import { useParams } from 'react-router-dom';
import { Modal } from 'ui/Modal/Modal';
import { TaskDetail } from 'components/Task/TaskDetail';
import { number } from 'yup';

interface IProps {}

export interface IAdminTask {
    id: number;
    name: string;
    task: string;
    task_type: 'prod' | 'user';
    cron: string;
    args: any[];
    kwargs: any[];
    last_run_at: number;
    total_run_count: number;
    enabled: boolean;
}

const tableColumns = [
    'id',
    'name',
    'task',
    'cron',
    'args',
    'kwargs',
    'last_run_at',
    'total_run_count',
    'enabled',
];

const tableColumnWidths = {
    id: 80,
    name: 200,
    task: 320,
    last_run_at: 280,
    total_run_count: 160,
    kwargs: 160,
    enabled: 100,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    total_run_count: 'center',
    args: 'center',
    enabled: 'center',
};

export const AdminTask: React.FunctionComponent<IProps> = () => {
    const { id: taskId } = useParams();

    const { data: taskList, forceFetch: loadTaskList } = useDataFetch<
        IAdminTask[]
    >({
        url: '/admin/task/',
    });
    const handleChangeEnabled = React.useCallback(
        async (taskId: number, val: boolean) => {
            const resp = await ds.update(`/admin/task/${taskId}/`, {
                enabled: val,
            });
            if (resp) {
                loadTaskList();
            }
        },
        []
    );

    const formatCell = React.useCallback(
        (index: number, column: string, row: IAdminTask) => {
            const key = column;
            const value = row[key];
            const taskId = row.id;
            let dom = value;
            switch (key) {
                case 'last_run_at': {
                    dom = (
                        <span>
                            {generateFormattedDate(value, 'X')},{' '}
                            {moment.utc(value, 'X').fromNow()}
                        </span>
                    );
                    break;
                }
                case 'kwargs': {
                    dom = <span>{JSON.stringify(value)}</span>;
                    break;
                }
                case 'enabled': {
                    dom = (
                        <ToggleSwitch
                            checked={value}
                            onChange={(val) => handleChangeEnabled(taskId, val)}
                        />
                    );
                    return (
                        <div
                            className={`div-${key} AdminTask-toggle`}
                            key={`${taskId}-${key}`}
                        >
                            {dom}
                        </div>
                    );
                }
            }
            return (
                <div
                    className={`div-${key}`}
                    key={`${taskId}-${key}`}
                    onClick={() => history.push(`/admin/task/${taskId}`)}
                >
                    {dom}
                </div>
            );
        },
        []
    );

    return taskId === undefined || taskList === null ? (
        <div className="AdminTask">
            <div className="AdminLanding-top">
                <div className="AdminLanding-title">Task</div>
                <div className="AdminLanding-desc">Manage all tasks here.</div>
            </div>
            <div className="AdminTask-content">
                {taskList ? (
                    <Table
                        rows={taskList}
                        cols={tableColumns}
                        formatCell={formatCell}
                        colNameToWidths={tableColumnWidths}
                        colNameToTextAlign={tableColumnAligns}
                        showAllRows={true}
                    />
                ) : null}
            </div>
        </div>
    ) : (
        <Modal onHide={() => history.push('/admin/task/')}>
            <TaskDetail
                task={taskList.find((task) => task.id === Number(taskId))}
            />
        </Modal>
    );
};
