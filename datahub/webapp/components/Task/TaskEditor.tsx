import * as React from 'react';
import { Formik, Form } from 'formik';
import moment from 'moment';
import * as Yup from 'yup';

import ds from 'lib/datasource';
import { generateFormattedDate } from 'lib/utils/datetime';
import { recurrenceToCron, cronToRecurrence } from 'lib/utils/cron';
import { sendNotification } from 'lib/dataHubUI';

import { IAdminTask } from 'components/AppAdmin/AdminTask';
import { TaskHistory } from './TaskHistory';

import { Button } from 'ui/Button/Button';
import { CronField } from 'ui/FormikField/CronField';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Tabs } from 'ui/Tabs/Tabs';

import './TaskEditor.scss';

interface IProps {
    task: IAdminTask;
    loadTaskList?: () => void;
}

const taskFormSchema = Yup.object().shape({
    recurrence: Yup.object().shape({
        hour: Yup.number().min(0).max(23),
        minute: Yup.number().min(0).max(59),
        recurrence: Yup.string().oneOf(['daily', 'weekly', 'monthly']),
        on: Yup.array().when('recurrence', (recurrence: string, schema) => {
            if (recurrence === 'weekly') {
                return schema.min(1).of(Yup.number().min(0).max(6));
            } else if (recurrence === 'monthly') {
                return schema.min(1).of(Yup.number().min(1).max(31));
            }

            return schema;
        }),
    }),
    enabled: Yup.boolean().required(),
});

export const TaskEditor: React.FunctionComponent<IProps> = ({
    task,
    loadTaskList,
}) => {
    const [tab, setTab] = React.useState<'edit' | 'history'>('edit');

    const runTask = React.useCallback(() => {
        ds.save(`/schedule/${task.id}/run/`).then(() => {
            sendNotification('Task has started!');
        });
        loadTaskList();
    }, [task]);

    const handleTaskEditSubmit = React.useCallback(
        async (editedValues) => {
            const editedCron = editedValues.isCron
                ? editedValues.cron
                : recurrenceToCron(editedValues.recurrence);
            ds.update(`/schedule/${task.id}/`, {
                cron: editedCron,
                enabled: editedValues.enabled,
                options: editedValues.taskOptions,
            }).then(({ data }) => {
                sendNotification('Schedule saved!');
                return data;
            });
        },

        [task]
    );

    const tabDOM = React.useMemo(() => {
        if (tab === 'edit') {
            const recurrence = cronToRecurrence(task.cron || '0 0 * * *');
            const formValues = {
                isCron: false,
                recurrence,
                cron: task.cron,
                enabled: task.enabled,
                taskOptions: task.options, // to be implemented
            };
            return (
                <div className="TaskEditor-form">
                    <Formik
                        isInitialValid={true}
                        initialValues={formValues}
                        validationSchema={taskFormSchema}
                        onSubmit={(values) => {
                            handleTaskEditSubmit(values);
                        }}
                    >
                        {({
                            handleSubmit,
                            values,
                            errors,
                            setFieldValue,
                            isValid,
                        }) => {
                            return (
                                <FormWrapper minLabelWidth="180px" size={7}>
                                    <Form>
                                        <div className="TaskEditor-form-fields ">
                                            <FormField label="Enable Schedule">
                                                <ToggleSwitch
                                                    checked={values.enabled}
                                                    onChange={(checked) => {
                                                        setFieldValue(
                                                            'enabled',
                                                            checked
                                                        );
                                                    }}
                                                />
                                            </FormField>
                                            {values.enabled ? (
                                                <div className="TaskEditor-schedule horizontal-space-between">
                                                    {values.isCron ? (
                                                        <FormField label="Cron Schedule">
                                                            <DebouncedInput
                                                                value={
                                                                    values.cron
                                                                }
                                                                onChange={(
                                                                    val
                                                                ) => {
                                                                    setFieldValue(
                                                                        'recurrence',
                                                                        val
                                                                    );
                                                                }}
                                                                inputProps={{
                                                                    className:
                                                                        'input',
                                                                }}
                                                                flex
                                                            />
                                                        </FormField>
                                                    ) : (
                                                        <FormField
                                                            stacked
                                                            label="Schedule"
                                                        >
                                                            <CronField
                                                                recurrence={
                                                                    values.recurrence
                                                                }
                                                                recurrenceError={
                                                                    errors?.recurrence
                                                                }
                                                                setRecurrence={
                                                                    setFieldValue
                                                                }
                                                            />
                                                        </FormField>
                                                    )}
                                                    <div className="TaskEditor-schedule-toggle mr16">
                                                        <ToggleButton
                                                            checked={
                                                                values.isCron
                                                            }
                                                            onChange={(
                                                                val: boolean
                                                            ) => {
                                                                setFieldValue(
                                                                    'isCron',
                                                                    val
                                                                );
                                                            }}
                                                            title="Use Cron"
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="TaskEditor-form-controls right-align mt16">
                                            <Button
                                                disabled={!isValid}
                                                onClick={() => handleSubmit()}
                                                title="Update Task"
                                                type="inlineText"
                                                borderless
                                            />
                                        </div>
                                    </Form>
                                </FormWrapper>
                            );
                        }}
                    </Formik>
                </div>
            );
        } else {
            return (
                <div className="TaskEditor-history">
                    <TaskHistory taskName={task.name} />
                </div>
            );
        }
    }, [task, tab]);

    return (
        <div className="TaskEditor">
            <div className="TaskEditor-top horizontal-space-between mv24 mh36">
                <div className="TaskEditor-info">
                    <div className="TaskEditor-name">{task.name}</div>
                    <div className="TaskEditor-task mb16">{task.task}</div>
                    <div className="TaskEditor-args">Args: {task.args}</div>
                    <div className="TaskEditor-kwargs">
                        Kwargs: {JSON.stringify(task.kwargs)}
                    </div>
                    <div className="TaskEditor-last-run">
                        Last Run: {generateFormattedDate(task.last_run_at, 'X')}
                        , {moment.utc(task.last_run_at, 'X').fromNow()}
                    </div>
                    <div className="TaskEditor-run-count">
                        Total Run Count: {task.total_run_count}
                    </div>
                </div>
                <div className="TaskEditor-controls">
                    <div className="TaskEditor-run">
                        <Button
                            title="Run Task"
                            icon="play"
                            onClick={runTask}
                            type="inlineText"
                            borderless
                        />
                    </div>
                </div>
            </div>
            <Tabs
                selectedTabKey={tab}
                className="mh16 mb16"
                items={[
                    { name: 'Edit', key: 'edit' },
                    { name: 'History', key: 'history' },
                ]}
                onSelect={(key: 'edit' | 'history') => {
                    setTab(key);
                }}
            />
            <div className="TaskEditor-content m24">{tabDOM}</div>
        </div>
    );
};
