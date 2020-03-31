import React from 'react';

import ds from 'lib/datasource';
import { sendNotification } from 'lib/dataHubUI';
import { generateFormattedDate } from 'lib/utils/datetime';

import { ITaskSchedule } from 'const/schedule';

import { JobStatus } from 'components/JobStatus/JobStatus';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { FormField } from 'ui/Form/FormField';
import { Modal } from 'ui/Modal/Modal';

import './ScheduledTaskEditor.scss';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

interface IProps {
    scheduleName: string;
    taskName: string;
    taskType: 'prod' | 'user';
    args?: any;
}

export const ScheduledTaskEditor: React.FunctionComponent<IProps> = ({
    scheduleName,
    taskName,
    taskType,
    args,
}) => {
    const [showPastRuns, setShowPastRuns] = React.useState(false);
    const [schedule, setSchedule] = React.useState(null);

    React.useEffect(() => {
        loadSchedule();
    }, []);

    const loadSchedule = React.useCallback(() => {
        ds.fetch(`/schedule/name/${scheduleName}/`).then(({ data }) => {
            setSchedule(data);
        });
    }, [scheduleName]);

    const createSchedule = React.useCallback(async () => {
        const { data } = await ds.save(`/schedule/`, {
            cron: schedule.cron,
            schedule_name: schedule.name,
            task_name: schedule.task,
            task_type: schedule.type,
            enabled: schedule.enabled,
            args,
        });
        setSchedule(data);
        return data as ITaskSchedule;
    }, [schedule, scheduleName, taskName, taskType]);

    const saveSchedule = React.useCallback(async () => {
        ds.update(`/schedule/${schedule.id}/`, {
            cron: schedule.cron,
            enabled: schedule.enabled,
        }).then(({ data }) => {
            sendNotification('Schedule saved!');
            setSchedule(data);
            return data;
        });
    }, [schedule]);

    const handleShowScheduleForm = React.useCallback(() => {
        if (!schedule) {
            setSchedule({
                name: scheduleName,
                task: taskName,
                type: taskType,
                cron: '0 0 * * *',
                enabled: true,
            });
        }
    }, [schedule]);

    const handleSaveSchedule = React.useCallback(() => {
        if (schedule?.id) {
            return saveSchedule();
        } else {
            return createSchedule();
        }
    }, [schedule]);

    const runSchedule = React.useCallback(() => {
        ds.save(`/schedule/${schedule.id}/run/`).then(() => {
            sendNotification('Task has started!');
        });
    }, [schedule]);

    const scheduleDOM = schedule ? (
        <div className="ScheduledTaskEditor-schedule">
            <div className="ScheduledTaskEditor-schedule-top horizontal-space-between">
                <div className="ScheduledTaskEditor-title">{schedule.name}</div>
                <div className="ScheduledTaskEditor-schedule-button">
                    <AsyncButton
                        type="inlineText"
                        title={schedule.id ? 'Save Changes' : 'Create Schedule'}
                        onClick={handleSaveSchedule}
                        borderless
                    />
                </div>
            </div>
            <div className="ScheduledTaskEditor-info">
                <div>Task name: {schedule.task}</div>
                {schedule.last_run_at && (
                    <div>
                        Last run: {generateFormattedDate(schedule.last_run_at)}
                    </div>
                )}
            </div>
            <div className="ScheduledTaskEditor-controls flex-row">
                <FormField stacked label="Cron">
                    <DebouncedInput
                        value={schedule.cron}
                        onChange={(val) => {
                            const updatedSchedule = {
                                ...schedule,
                                cron: val,
                            };
                            setSchedule(updatedSchedule);
                        }}
                        inputProps={{
                            className: 'input',
                        }}
                        flex
                    />
                </FormField>
                <FormField stacked label="Enabled">
                    <ToggleSwitch
                        checked={schedule.enabled}
                        onChange={(checked) => {
                            const updatedSchedule = {
                                ...schedule,
                                enabled: checked,
                            };
                            setSchedule(updatedSchedule);
                        }}
                    />
                </FormField>
            </div>
        </div>
    ) : null;

    const runHistoryDOM = showPastRuns && schedule?.id && (
        <Modal
            onHide={() => setShowPastRuns(false)}
            title={`Run History: ${schedule.name} `}
        >
            <JobStatus name={schedule.name} />
        </Modal>
    );

    return (
        <div className="ScheduledTaskEditor">
            <div className="ScheduledTaskEditor-top horizontal-space-between">
                <div className="ScheduledTaskEditor-buttons">
                    {schedule?.id ? (
                        <Button
                            title="Run Update"
                            icon="play"
                            onClick={runSchedule}
                            type="inlineText"
                            borderless
                        />
                    ) : null}
                    {schedule?.last_run_at ? (
                        <Button
                            title="See Past Runs"
                            icon="list"
                            onClick={() => setShowPastRuns(true)}
                            type="inlineText"
                            borderless
                        />
                    ) : null}
                </div>
                {!schedule && (
                    <div className="ScheduledTaskEditor-schedule-button flex-center">
                        <Button
                            title="Create Schedule"
                            onClick={handleShowScheduleForm}
                            type="inlineText"
                            borderless
                        />
                    </div>
                )}
            </div>
            {scheduleDOM}
            {runHistoryDOM}
        </div>
    );
};
