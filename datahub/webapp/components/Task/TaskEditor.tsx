import * as React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';
import moment from 'moment';
import * as Yup from 'yup';

import ds from 'lib/datasource';
import { generateFormattedDate } from 'lib/utils/datetime';
import {
    recurrenceToCron,
    cronToRecurrence,
    validateCronForReuccrence,
} from 'lib/utils/cron';
import { sendNotification } from 'lib/dataHubUI';

import { IAdminTask } from 'components/AppAdmin/AdminTask';
import { TaskStatus } from 'components/Task/TaskStatus';

import { Button } from 'ui/Button/Button';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { FormField, FormFieldInputSection } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { IconButton } from 'ui/Button/IconButton';
import { RecurrenceEditor } from 'ui/ReccurenceEditor/RecurrenceEditor';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Tabs } from 'ui/Tabs/Tabs';

import './TaskEditor.scss';

type TaskEditorTabs = 'edit' | 'history';

interface IProps {
    task: Partial<IAdminTask>;
    onTaskUpdate?: () => void;
    onTaskCreate?: () => void;
}

const taskFormSchema = Yup.object().shape({
    isCron: Yup.boolean(),
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
    cron: Yup.string(),
    enabled: Yup.boolean().required(),
    arg: Yup.array().of(Yup.mixed()),
    kwargs: Yup.object(),
    tempKwargs: Yup.array().of(Yup.mixed()),
});

function stringToTypedVal(stringVal) {
    if (stringVal === true || stringVal === 'true') {
        return true;
    } else if (stringVal === false || stringVal === 'false') {
        return false;
    } else if (Number.isInteger(Number(stringVal))) {
        return Number(stringVal);
    } else {
        return stringVal;
    }
}

export const TaskEditor: React.FunctionComponent<IProps> = ({
    task,
    onTaskUpdate,
    onTaskCreate,
}) => {
    const [tab, setTab] = React.useState<TaskEditorTabs>('edit');
    const [showCreateForm, setShowCreateForm] = React.useState<boolean>(false);

    React.useEffect(() => {
        setTab('edit');
    }, [task]);

    const runTask = React.useCallback(() => {
        ds.save(`/schedule/${task.id}/run/`).then(() => {
            sendNotification('Task has started!');
        });
        onTaskUpdate?.();
    }, [task]);

    const handleTaskEditSubmit = React.useCallback(
        async (editedValues) => {
            const editedCron = editedValues.isCron
                ? editedValues.cron
                : recurrenceToCron(editedValues.recurrence);
            const editedArgs = editedValues.args.map((arg) =>
                stringToTypedVal(arg)
            );
            const editedKwargs = { ...editedValues.kwargs };
            if (editedValues.tempKwargs.length) {
                for (const tempKwarg of editedValues.tempKwargs) {
                    if (
                        tempKwarg[0].length &&
                        !Object.keys(editedKwargs).includes(tempKwarg[0])
                    ) {
                        editedKwargs[tempKwarg[0]] = stringToTypedVal(
                            tempKwarg[1]
                        );
                    }
                }
            }

            if (task.id) {
                ds.update(`/schedule/${task.id}/`, {
                    cron: editedCron,
                    enabled: editedValues.enabled,
                    args: editedArgs,
                    kwargs: editedKwargs,
                }).then(({ data }) => {
                    sendNotification('Task saved!');
                    return data;
                });
            } else {
                ds.save(`/schedule/`, {
                    cron: editedCron,
                    name: task.name,
                    task: task.task,
                    task_type: task.task_type,
                    enabled: editedValues.enabled,
                    args: task.args,
                    kwrgs: task.kwargs || {},
                }).then(({ data }) => {
                    sendNotification('Task created!');
                    onTaskCreate?.();
                    return data;
                });
            }
        },

        [task]
    );

    const formValues = React.useMemo(() => {
        const recurrence = cronToRecurrence(task.cron || '0 0 * * *');
        return {
            isCron: !validateCronForReuccrence(task.cron),
            recurrence,
            cron: task.cron,
            enabled: task.enabled,
            args: task.args || [],
            kwargs: task.kwargs,
            tempKwargs: [],
        };
    }, [task]);

    const getTabDOM = () => {
        if (tab === 'edit') {
            return (
                <div className="TaskEditor-form">
                    <Formik
                        isInitialValid={true}
                        initialValues={formValues}
                        validationSchema={taskFormSchema}
                        onSubmit={(values) => {
                            handleTaskEditSubmit(values);
                        }}
                        enableReinitialize
                    >
                        {({
                            handleSubmit,
                            values,
                            errors,
                            setFieldValue,
                            isValid,
                        }) => {
                            const argsDOM = (
                                <FieldArray
                                    name="args"
                                    render={(arrayHelpers) => {
                                        const fields = values.args.length
                                            ? values.args.map(
                                                  (ignore, index) => (
                                                      <div
                                                          key={index}
                                                          className="horizontal-space-between"
                                                      >
                                                          <FormField>
                                                              <FormFieldInputSection>
                                                                  <Field
                                                                      name={`args[${index}]`}
                                                                      placeholder="Insert arg"
                                                                  />
                                                              </FormFieldInputSection>
                                                          </FormField>
                                                          <div className="mr8">
                                                              <IconButton
                                                                  icon="x"
                                                                  onClick={() =>
                                                                      arrayHelpers.remove(
                                                                          index
                                                                      )
                                                                  }
                                                              />
                                                          </div>
                                                      </div>
                                                  )
                                              )
                                            : null;
                                        const controlDOM = (
                                            <div className="center-align mt8 mb4">
                                                <Button
                                                    title="Add New Arg"
                                                    onClick={() =>
                                                        arrayHelpers.push('')
                                                    }
                                                    type="soft"
                                                    borderless
                                                />
                                            </div>
                                        );

                                        return (
                                            <div className="TaskEditor-args">
                                                <FormField stacked label="Args">
                                                    <fieldset>
                                                        {fields}
                                                    </fieldset>
                                                </FormField>
                                                {controlDOM}
                                            </div>
                                        );
                                    }}
                                />
                            );
                            const newKwargsDOM = (
                                <FieldArray
                                    name="tempKwargs"
                                    render={(arrayHelpers) => {
                                        const fields = values.tempKwargs.length
                                            ? values.tempKwargs.map(
                                                  (ignore, index) => (
                                                      <div
                                                          key={index}
                                                          className="horizontal-space-between mb8 mr8"
                                                      >
                                                          <FormField>
                                                              <FormFieldInputSection>
                                                                  <Field
                                                                      name={`tempKwargs[${index}][0]`}
                                                                      placeholder="Insert key"
                                                                  />
                                                              </FormFieldInputSection>
                                                              <FormFieldInputSection>
                                                                  <Field
                                                                      name={`tempKwargs[${index}][1]`}
                                                                      placeholder="Insert value"
                                                                  />
                                                              </FormFieldInputSection>
                                                          </FormField>
                                                          <div>
                                                              <IconButton
                                                                  icon="x"
                                                                  onClick={() =>
                                                                      arrayHelpers.remove(
                                                                          index
                                                                      )
                                                                  }
                                                              />
                                                          </div>
                                                      </div>
                                                  )
                                              )
                                            : null;
                                        const controlDOM = (
                                            <div className="TaskEditor-kwarg-button center-align mt4 ml4 mb16">
                                                <Button
                                                    title="Add New Kwarg"
                                                    onClick={() =>
                                                        arrayHelpers.push([
                                                            '',
                                                            '',
                                                        ])
                                                    }
                                                    type="soft"
                                                    borderless
                                                />
                                            </div>
                                        );
                                        return (
                                            <div className="TaskEditor-new-kwargs-input">
                                                <fieldset>{fields}</fieldset>
                                                {controlDOM}
                                            </div>
                                        );
                                    }}
                                />
                            );
                            const kwargsDOM = (
                                <FormField stacked label="Kwargs">
                                    {Object.entries(values.kwargs).map(
                                        (kwarg) => {
                                            return (
                                                <div
                                                    className="TaskEditor-kwargs-input"
                                                    key={kwarg[0]}
                                                >
                                                    <FormField label={kwarg[0]}>
                                                        <DebouncedInput
                                                            value={kwarg[1]}
                                                            onChange={(val) => {
                                                                const newKwargs = {
                                                                    ...values.kwargs,
                                                                    [kwarg[0]]: stringToTypedVal(
                                                                        val
                                                                    ),
                                                                };
                                                                setFieldValue(
                                                                    'kwargs',
                                                                    newKwargs
                                                                );
                                                            }}
                                                        />
                                                        <IconButton
                                                            icon="x"
                                                            onClick={() => {
                                                                const newKwargs = {
                                                                    ...values.kwargs,
                                                                };
                                                                delete newKwargs[
                                                                    kwarg[0]
                                                                ];
                                                                setFieldValue(
                                                                    'kwargs',
                                                                    newKwargs
                                                                );
                                                            }}
                                                        />
                                                    </FormField>
                                                </div>
                                            );
                                        }
                                    )}
                                    {newKwargsDOM}
                                </FormField>
                            );

                            return (
                                <FormWrapper minLabelWidth="180px" size={7}>
                                    <Form>
                                        <div className="TaskEditor-form-fields">
                                            {/* <SimpleField
                                                name="args"
                                                type="input"
                                                inputProps={{
                                                    value: values.args,
                                                }}
                                            /> */}
                                            {argsDOM}
                                            {kwargsDOM}
                                            <div className="TaskEditor-toggle">
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
                                            </div>
                                            {values.enabled ? (
                                                <div className="TaskEditor-schedule horizontal-space-between">
                                                    {values.isCron ||
                                                    !validateCronForReuccrence(
                                                        values.cron
                                                    ) ? (
                                                        <FormField label="Cron Schedule">
                                                            <DebouncedInput
                                                                value={
                                                                    values.cron
                                                                }
                                                                onChange={(
                                                                    val
                                                                ) => {
                                                                    setFieldValue(
                                                                        'cron',
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
                                                            <RecurrenceEditor
                                                                recurrence={
                                                                    values.recurrence
                                                                }
                                                                recurrenceError={
                                                                    errors?.recurrence
                                                                }
                                                                setRecurrence={(
                                                                    val
                                                                ) =>
                                                                    setFieldValue(
                                                                        'recurrence',
                                                                        val
                                                                    )
                                                                }
                                                            />
                                                        </FormField>
                                                    )}
                                                    {validateCronForReuccrence(
                                                        values.cron
                                                    ) ? (
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
                                                                title={
                                                                    values.isCron
                                                                        ? 'Use Recurrence Editor'
                                                                        : 'Use Cron'
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </div>
                                        <div className="TaskEditor-form-controls right-align mt16">
                                            <Button
                                                disabled={!isValid}
                                                onClick={() => handleSubmit()}
                                                title={
                                                    task.id
                                                        ? 'Update Task'
                                                        : 'Create Task'
                                                }
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
                    <TaskStatus taskId={task.id} taskName={task.name} />
                </div>
            );
        }
    };

    return task.id || showCreateForm ? (
        <div className="TaskEditor">
            <div className="TaskEditor-top horizontal-space-between mv24 mh36">
                <div className="TaskEditor-info">
                    <div className="TaskEditor-name">{task.name}</div>
                    <div className="TaskEditor-task mb16">{task.task}</div>
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
                onSelect={(key: TaskEditorTabs) => {
                    setTab(key);
                }}
            />
            <div className="TaskEditor-content m24">{getTabDOM()}</div>
        </div>
    ) : (
        <div className="TaskEditor-new center-align">
            <Button
                title="Create Schedule"
                onClick={() => setShowCreateForm(true)}
                type="inlineText"
                borderless
            />
        </div>
    );
};
