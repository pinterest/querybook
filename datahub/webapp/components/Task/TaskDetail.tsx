import * as React from 'react';
import { IAdminTask } from 'components/AppAdmin/AdminTask';

interface IProps {
    task: IAdminTask;
}

export const TaskDetail: React.FunctionComponent<IProps> = ({ task }) => {
    // see details, run task, see history, edit task
    console.log('task', task);
    return null;
};
