import * as React from 'react';
import moment from 'moment';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { generateFormattedDate } from 'lib/utils/datetime';
import history from 'lib/router-history';

import { useResource } from 'hooks/useResource';
import { AdminTaskResource } from 'resource/admin/task';

import { ITaskSchedule, TaskType } from 'const/schedule';
import { TaskEditor } from 'components/Task/TaskEditor';

import { Button } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Table, TableAlign } from 'ui/Table/Table';
import { Tabs } from 'ui/Tabs/Tabs';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Level } from 'ui/Level/Level';
import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';

import './AdminTask.scss';

const tableColumns = [
    'id',
    'name',
    'task',
    'cron',
    'args',
    'kwargs',
    'options',
    'last_run_at',
    'total_run_count',
    'enabled',
];

const tableColumnWidths = {
    id: 80,
    name: 200,
    task: 320,
    cron: 160,
    last_run_at: 280,
    total_run_count: 160,
    kwargs: 160,
    options: 160,
    enabled: 100,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    cron: 'center',
    last_run_at: 'center',
    total_run_count: 'center',
    enabled: 'center',
};

export const AdminTask: React.FC = () => {
    const { id: detailTaskId } = useParams();

    const [type, setType] = React.useState<TaskType>('prod');
    const [searchString, setSearchString] = React.useState<string>('');

    const { data: taskList, forceFetch: loadTaskList } = useResource(
        AdminTaskResource.getAll
    );

    const filteredTaskList = React.useMemo(
        () =>
            (taskList || []).filter(
                (task) =>
                    task.task_type === type &&
                    task.name.includes(searchString.toLocaleLowerCase())
            ),
        [taskList, searchString, type]
    );

    const handleChangeEnabled = React.useCallback(
        async (taskId: number, val: boolean) => {
            toast.promise(
                AdminTaskResource.toggleEnabled(taskId, val).then(
                    ({ data }) => {
                        loadTaskList();
                        return data;
                    }
                ),
                {
                    loading: 'Updating schedule...',
                    success: val ? 'Schedule enabled!' : 'Schedule disabled!',
                    error: 'Update schedule failed.',
                }
            );
        },
        []
    );

    const goToTask = React.useCallback((taskId) => {
        history.push(`/admin/task/${taskId}/`);
    }, []);

    const formatCell = React.useCallback(
        (index: number, column: string, row: ITaskSchedule) => {
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
                case 'kwargs':
                case 'options': {
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
                    className={`div-${key} AdminTask-clickable`}
                    key={`${taskId}-${key}`}
                    onClick={() => goToTask(taskId)}
                >
                    {dom}
                </div>
            );
        },
        []
    );

    const detailTask = React.useMemo(
        () => taskList?.find((task) => task.id === Number(detailTaskId)),
        [taskList, detailTaskId]
    );
    return (
        <div className="AdminTask">
            <div className="AdminLanding-top">
                <Level>
                    <div className="AdminLanding-title">Task</div>
                    <AdminAuditLogButton itemType={'task'} />
                </Level>
                <div className="AdminLanding-desc">Manage all tasks here.</div>
            </div>
            <div className="AdminTask-content">
                <div className="AdminTask-controls horizontal-space-between mb24">
                    <Tabs
                        selectedTabKey={type}
                        items={[
                            { name: 'Production', key: 'prod' },
                            { name: 'User', key: 'user' },
                        ]}
                        onSelect={(key: TaskType) => {
                            setType(key);
                        }}
                    />
                    <div className="AdminTask-controls-left flex-row">
                        <SearchBar
                            className="mr12"
                            value={searchString}
                            placeholder="Filter by name"
                            onSearch={(s) =>
                                setSearchString(s.replace(' ', ''))
                            }
                        />
                        <Button
                            title="Create Task"
                            onClick={() => history.push('/admin/task/new/')}
                        />
                    </div>
                </div>
                {taskList ? (
                    <Table
                        rows={filteredTaskList}
                        cols={tableColumns}
                        formatCell={formatCell}
                        colNameToWidths={tableColumnWidths}
                        colNameToTextAlign={tableColumnAligns}
                        showAllRows={true}
                    />
                ) : null}
            </div>
            {detailTask || detailTaskId === 'new' ? (
                <Modal
                    onHide={() => history.push('/admin/task/')}
                    title="Task Editor"
                >
                    <TaskEditor
                        task={detailTask || {}}
                        onTaskUpdate={loadTaskList}
                        onTaskDelete={() => {
                            loadTaskList();
                            history.push('/admin/task/');
                        }}
                        onTaskCreate={(taskId) => {
                            loadTaskList();
                            goToTask(taskId);
                        }}
                    />
                </Modal>
            ) : null}
        </div>
    );
};
