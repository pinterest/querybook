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

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { FormField, FormFieldInputSection } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { IconButton } from 'ui/Button/IconButton';
import { RecurrenceEditor } from 'ui/ReccurenceEditor/RecurrenceEditor';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Tabs } from 'ui/Tabs/Tabs';
import { Title } from 'ui/Title/Title';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';

import './TaskEditor.scss';

type TaskEditorTabs = 'edit' | 'history';

interface IProps {
    task: Partial<IAdminTask>;
    onTaskUpdate?: () => void;
    onTaskCreate?: () => void;
    showCreateForm?: boolean;
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
});

function stringToTypedVal(stringVal) {
    if (stringVal === true || stringVal === 'true') {
        return true;
    } else if (stringVal === false || stringVal === 'false') {
        return false;
    } else if (!isNaN(Number(stringVal))) {
        return Number(stringVal);
    } else {
        return stringVal;
    }
}

export const TaskEditor: React.FunctionComponent<IProps> = ({
    task,
    onTaskUpdate,
    onTaskCreate,
    showCreateForm = false,
}) => {
    const [tab, setTab] = React.useState<TaskEditorTabs>('edit');
    const [showForm, setShowForm] = React.useState<boolean>(
        !!task.id || showCreateForm
    );

    React.useEffect(() => {
        setTab('edit');
    }, [task]);

    const runTask = React.useCallback(async () => {
        await ds.save(`/schedule/${task.id}/run/`);
        sendNotification('Task has started!');
        onTaskUpdate?.();
    }, [task]);

    const handleTaskEditSubmit = React.useCallback(
        async (editedValues) => {
            const editedCron = editedValues.isCron
                ? editedValues.cron
                : recurrenceToCron(editedValues.recurrence);
            const editedArgs = editedValues.args
                .filter((arg) => !(arg === ''))
                .map((arg) => stringToTypedVal(arg));
            const editedKwargs = {};
            if (editedValues.kwargs.length) {
                for (const kwarg of editedValues.kwargs) {
                    if (
                        kwarg[0].length &&
                        !Object.keys(editedKwargs).includes(kwarg[0])
                    ) {
                        editedKwargs[kwarg[0]] = stringToTypedVal(kwarg[1]);
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
                    onTaskUpdate?.();
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
                    kwargs: task.kwargs || {},
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
        const cron = task.cron || '0 0 * * *';
        const recurrence = cronToRecurrence(cron);
        return {
            name: task.name || 'task_name',
            task: task.task || '',
            isCron: !validateCronForReuccrence(cron),
            recurrence,
            cron,
            enabled: task.enabled || true,
            args: task.args || [],
            kwargs: Object.entries(task.kwargs || {}),
        };
    }, [task]);

    const getEditDOM = (values, errors, setFieldValue, isValid, submitForm) => {
        const argsDOM = (
            <FieldArray
                name="args"
                render={(arrayHelpers) => {
                    const fields = values.args.length
                        ? values.args.map((ignore, index) => (
                              <div key={index} className="flex-row">
                                  <FormField>
                                      <FormFieldInputSection>
                                          <Field
                                              name={`args[${index}]`}
                                              placeholder="Insert arg"
                                          />
                                      </FormFieldInputSection>
                                  </FormField>
                                  <div>
                                      <IconButton
                                          icon="x"
                                          onClick={() =>
                                              arrayHelpers.remove(index)
                                          }
                                      />
                                  </div>
                              </div>
                          ))
                        : null;
                    const controlDOM = (
                        <div className="mv8 ml12">
                            <Button
                                title="Add New Arg"
                                onClick={() => arrayHelpers.push('')}
                                type="soft"
                                borderless
                            />
                        </div>
                    );

                    return (
                        <div className="TaskEditor-args">
                            <FormField stacked label="Args">
                                <fieldset>{fields}</fieldset>
                            </FormField>
                            {controlDOM}
                        </div>
                    );
                }}
            />
        );

        const kwargsDOM = (
            <div className="TaskEditor-kwargs">
                <FormField stacked label="Kwargs">
                    <FieldArray
                        name="kwargs"
                        render={(arrayHelpers) => {
                            const fields = values.kwargs.length
                                ? values.kwargs.map((ignore, index) => (
                                      <div key={index} className="flex-row mb8">
                                          <FormField>
                                              <FormFieldInputSection className="mr16">
                                                  <Field
                                                      name={`kwargs[${index}][0]`}
                                                      placeholder="Insert key"
                                                  />
                                              </FormFieldInputSection>
                                              <FormFieldInputSection>
                                                  <Field
                                                      name={`kwargs[${index}][1]`}
                                                      placeholder="Insert value"
                                                  />
                                              </FormFieldInputSection>
                                          </FormField>
                                          <div>
                                              <IconButton
                                                  icon="x"
                                                  onClick={() =>
                                                      arrayHelpers.remove(index)
                                                  }
                                              />
                                          </div>
                                      </div>
                                  ))
                                : null;
                            const controlDOM = (
                                <div className="TaskEditor-kwarg-button mt4 ml4 mb16">
                                    <Button
                                        title="Add New Kwarg"
                                        onClick={() =>
                                            arrayHelpers.push(['', ''])
                                        }
                                        type="soft"
                                        borderless
                                    />
                                </div>
                            );
                            return (
                                <div>
                                    <fieldset>{fields}</fieldset>
                                    {controlDOM}
                                </div>
                            );
                        }}
                    />
                </FormField>
            </div>
        );
        return (
            <div className="TaskEditor-form">
                <FormWrapper minLabelWidth="180px" size={7}>
                    <Form>
                        <div className="TaskEditor-form-fields">
                            <SimpleField
                                label="Name"
                                type="input"
                                name="name"
                            />
                            <SimpleField
                                label="Task"
                                type="input"
                                name="task"
                            />
                            {argsDOM}
                            {kwargsDOM}
                            <div className="TaskEditor-toggle">
                                <SimpleField
                                    label="Enable Schedule"
                                    type="toggle"
                                    name="enabled"
                                />
                            </div>
                            {values.enabled ? (
                                <div className="TaskEditor-schedule horizontal-space-between">
                                    {values.isCron ||
                                    !validateCronForReuccrence(values.cron) ? (
                                        <SimpleField
                                            label="Cron Schedule"
                                            type="input"
                                            name="cron"
                                        />
                                    ) : (
                                        <FormField stacked label="Schedule">
                                            <RecurrenceEditor
                                                recurrence={values.recurrence}
                                                recurrenceError={
                                                    errors?.recurrence
                                                }
                                                setRecurrence={(val) =>
                                                    setFieldValue(
                                                        'recurrence',
                                                        val
                                                    )
                                                }
                                            />
                                        </FormField>
                                    )}
                                    {validateCronForReuccrence(values.cron) ? (
                                        <div className="TaskEditor-schedule-toggle mr16">
                                            <ToggleButton
                                                checked={values.isCron}
                                                onChange={(val: boolean) => {
                                                    setFieldValue(
                                                        'isCron',
                                                        val
                                                    );
                                                    if (val) {
                                                        setFieldValue(
                                                            'cron',
                                                            recurrenceToCron(
                                                                values.recurrence
                                                            )
                                                        );
                                                    } else {
                                                        setFieldValue(
                                                            'recurrence',
                                                            cronToRecurrence(
                                                                values.cron
                                                            )
                                                        );
                                                    }
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
                            <AsyncButton
                                disabled={!isValid}
                                onClick={submitForm}
                                title={task.id ? 'Update Task' : 'Create Task'}
                                type="inlineText"
                                borderless
                            />
                        </div>
                    </Form>
                </FormWrapper>
            </div>
        );
    };

    const historyDOM = () => (
        <div className="TaskEditor-history">
            <TaskStatus taskId={task.id} taskName={task.name} />
        </div>
    );

    return showForm ? (
        <div className="TaskEditor">
            <Formik
                isInitialValid={true}
                initialValues={formValues}
                validationSchema={taskFormSchema}
                onSubmit={handleTaskEditSubmit}
                enableReinitialize
            >
                {({ values, errors, setFieldValue, isValid, submitForm }) => {
                    return (
                        <>
                            <div className="TaskEditor-top horizontal-space-between mv24 mh36">
                                <div className="TaskEditor-info">
                                    <Title size={3} weight="bold">
                                        {values.name}
                                    </Title>
                                    <div className="mb16">{values.task}</div>
                                    {task.id ? (
                                        <>
                                            <div>
                                                Last Run:{' '}
                                                {generateFormattedDate(
                                                    task.last_run_at,
                                                    'X'
                                                )}
                                                ,{' '}
                                                {moment
                                                    .utc(task.last_run_at, 'X')
                                                    .fromNow()}
                                            </div>
                                            <div>
                                                Total Run Count:{' '}
                                                {task.total_run_count}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                                <div className="TaskEditor-controls">
                                    <div className="TaskEditor-run">
                                        <AsyncButton
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
                            <div className="TaskEditor-content m24">
                                {tab === 'edit'
                                    ? getEditDOM(
                                          values,
                                          errors,
                                          setFieldValue,
                                          isValid,
                                          submitForm
                                      )
                                    : historyDOM}
                            </div>
                        </>
                    );
                }}
            </Formik>
        </div>
    ) : (
        <div className="TaskEditor-new center-align">
            <Button
                title="Create Schedule"
                onClick={() => setShowForm(true)}
                type="inlineText"
                borderless
            />
        </div>
    );
};
