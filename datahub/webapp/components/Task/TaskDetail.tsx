import * as React from 'react';
import { IAdminTask } from 'components/AppAdmin/AdminTask';
import { generateFormattedDate } from 'lib/utils/datetime';
import moment from 'moment';
import { Tabs } from 'ui/Tabs/Tabs';
import { TaskEdit } from './TaskEdit';
import { TaskHistory } from './TaskHistory';

import './TaskDetail.scss';

interface IProps {
    task: IAdminTask;
}

export const TaskDetail: React.FunctionComponent<IProps> = ({ task }) => {
    const [tab, setTab] = React.useState<'setting' | 'history'>('setting');
    // see details, run task, see history, edit task

    return (
        <div className="TaskDetail mv16 mh36">
            <div className="TaskDetail-details mb24">
                <div className="TaskDetail-top">
                    <div className="TaskDetail-name">{task.name}</div>
                    <div className="TaskDetail-task mb16">{task.task}</div>
                    <div className="TaskDetail-args">Args: {task.args}</div>
                    <div className="TaskDetail-kwargs">
                        Kwargs: {JSON.stringify(task.kwargs)}
                    </div>
                    <div className="TaskDetail-last-run">
                        Last Run: {generateFormattedDate(task.last_run_at, 'X')}
                        , {moment.utc(task.last_run_at, 'X').fromNow()}
                    </div>
                    <div className="TaskDetail-run-count">
                        Total Run Count: {task.total_run_count}
                    </div>
                </div>
            </div>
            <Tabs
                selectedTabKey={tab}
                className="mb16"
                items={[
                    { name: 'Settings', key: 'setting' },
                    { name: 'History', key: 'history' },
                ]}
                onSelect={(key: 'setting' | 'history') => {
                    setTab(key);
                }}
            />
            {tab === 'setting' ? (
                <div className="TaskDetail-settings">
                    <TaskEdit
                        taskId={task.id}
                        cron={task.cron}
                        enabled={task.enabled}
                        taskOptions={task.options}
                    />
                </div>
            ) : (
                <div className="TaskDetail-history">
                    <TaskHistory taskName={task.name} />
                </div>
            )}
        </div>
    );
};
