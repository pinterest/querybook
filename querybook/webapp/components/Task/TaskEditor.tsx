import { Field, FieldArray, Form, Formik } from 'formik';
import * as React from 'react';
import toast from 'react-hot-toast';
import * as Yup from 'yup';

import { AdminAuditLogButton } from 'components/AdminAuditLog/AdminAuditLogButton';
import { TaskStatus } from 'components/Task/TaskStatus';
import { ITaskSchedule } from 'const/schedule';
import { useResource } from 'hooks/useResource';
import { sendConfirm } from 'lib/querybookUI';
import {
    cronToRecurrence,
    recurrenceOnYup,
    recurrenceToCron,
    recurrenceTypes,
} from 'lib/utils/cron';
import { TaskScheduleResource } from 'resource/taskSchedule';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button, SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { FormField, FormFieldInputSection } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { RecurrenceEditor } from 'ui/ReccurenceEditor/RecurrenceEditor';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimeFromNow } from 'ui/Timer/TimeFromNow';
import { Title } from 'ui/Title/Title';

import './TaskEditor.scss';

type TaskEditorTabs = 'edit' | 'history';

interface IProps {
    task: Partial<ITaskSchedule>;
    onTaskUpdate?: () => void;
    onTaskDelete?: () => void;
    onTaskCreate?: (id?: number) => void;
}

const taskFormSchema = Yup.object().shape({
    name: Yup.string().required(),
    task: Yup.string().required(),

    recurrence: Yup.object().shape({
        hour: Yup.number().min(0).max(23),
        minute: Yup.number().min(0).max(59),
        recurrence: Yup.string().oneOf(recurrenceTypes),
        on: recurrenceOnYup,
        cron: Yup.string().optional(),
    }),
    enabled: Yup.boolean().required(),
    arg: Yup.array().of(Yup.mixed()),
    kwargs: Yup.array().of(Yup.mixed()),
});

function stringToTypedVal(stringVal: boolean | number | string) {
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
    onTaskDelete,
    onTaskCreate,
}) => {
    const [tab, setTab] = React.useState<TaskEditorTabs>('edit');

    const { data: registeredTaskList } = useResource(
        TaskScheduleResource.getRegisteredTasks
    );
    const { data: registeredTaskParamList } = useResource(
        TaskScheduleResource.getRegisteredTaskParams
    );

    React.useEffect(() => {
        setTab('edit');
    }, [task.id]);

    const runTask = React.useCallback(async () => {
        await TaskScheduleResource.run(task.id);
        toast.success('Task has started!');
        onTaskUpdate?.();
    }, [task]);

    const handleTaskEditSubmit = React.useCallback(
        (editedValues) => {
            const editedCron = recurrenceToCron(editedValues.recurrence);
            const editedArgs = editedValues.args
                .filter((arg) => !(arg === ''))
                .map(stringToTypedVal);
            const editedKwargs = {};
            if (editedValues.kwargs.length) {
                for (const kwarg of editedValues.kwargs) {
                    if (
                        kwarg[0].length &&
                        !Object.keys(editedKwargs).includes(kwarg[0]) &&
                        kwarg[1] != null &&
                        kwarg[1] !== ''
                    ) {
                        editedKwargs[kwarg[0]] = stringToTypedVal(kwarg[1]);
                    }
                }
            }

            if (task.id) {
                TaskScheduleResource.update(task.id, {
                    cron: editedCron,
                    enabled: editedValues.enabled,
                    args: editedArgs,
                    kwargs: editedKwargs,
                }).then(() => {
                    toast.success('Task saved!');
                    onTaskUpdate?.();
                });
            } else {
                toast.promise(
                    TaskScheduleResource.create({
                        cron: editedCron,
                        name: editedValues.name,
                        task: editedValues.task,
                        enabled: editedValues.enabled,
                        args: editedArgs,
                        kwargs: editedKwargs,
                    }).then(({ data }) => {
                        onTaskCreate?.(data.id);
                    }),
                    {
                        loading: 'Creating task...',
                        success: 'Task created!',
                        error: 'Task creation failed - task name must be unique',
                    }
                );
            }
        },

        [task]
    );

    const handleDeleteTask = React.useCallback(() => {
        sendConfirm({
            header: `Delete ${task.name}?`,
            message: 'Deleted tasks cannot be recovered.',
            onConfirm: () => {
                TaskScheduleResource.delete(task.id).then(() => {
                    toast.success('Task deleted!');
                    onTaskDelete?.();
                });
            },
        });
    }, [task]);

    const formValues = React.useMemo(() => {
        const cron = task.cron || '0 0 * * *';
        const recurrence = cronToRecurrence(cron);
        return {
            name: task.name || '',
            task: task.task || '',
            recurrence,
            enabled: task.enabled ?? true,
            args: task.args || [],
            kwargs: Object.entries(task.kwargs || {}),
        };
    }, [task]);

    const getEditDOM = (
        values: typeof formValues,
        errors,
        setFieldValue,
        isValid: boolean,
        submitForm
    ) => {
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
                                          icon="X"
                                          onClick={() =>
                                              arrayHelpers.remove(index)
                                          }
                                      />
                                  </div>
                              </div>
                          ))
                        : null;
                    const controlDOM = (
                        <div className="mv4 ml12">
                            <SoftButton
                                title="Add New Arg"
                                onClick={() => arrayHelpers.push('')}
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

        const getKwargPlaceholder = (param: string) =>
            registeredTaskParamList?.[values.task]?.[param] ?? 'Insert value';

        const kwargsDOM = (
            <div className="TaskEditor-kwargs mt12">
                <FormField stacked label="Kwargs">
                    <FieldArray
                        name="kwargs"
                        render={(arrayHelpers) => {
                            const fields = values.kwargs.length
                                ? values.kwargs.map((ignore, index) => (
                                      <div key={index} className="flex-row">
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
                                                      placeholder={getKwargPlaceholder(
                                                          values.kwargs[
                                                              index
                                                          ][0]
                                                      )}
                                                  />
                                              </FormFieldInputSection>
                                          </FormField>
                                          <div>
                                              <IconButton
                                                  icon="X"
                                                  onClick={() =>
                                                      arrayHelpers.remove(index)
                                                  }
                                              />
                                          </div>
                                      </div>
                                  ))
                                : null;
                            const controlDOM = (
                                <div className="TaskEditor-kwarg-button mt8 ml4 mb16">
                                    <SoftButton
                                        title="Add New Kwarg"
                                        onClick={() =>
                                            arrayHelpers.push(['', ''])
                                        }
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
                            {task.id ? null : (
                                <>
                                    <SimpleField
                                        label="Name"
                                        type="input"
                                        name="name"
                                        inputProps={{
                                            placeholder:
                                                'A unique task name must be supplied',
                                        }}
                                        help="Task name must be unique"
                                    />
                                    <SimpleField
                                        label="Task"
                                        type="react-select"
                                        name="task"
                                        options={registeredTaskList}
                                        onChange={(val) => {
                                            setFieldValue('args', [], false);
                                            setFieldValue(
                                                'kwargs',
                                                Object.keys(
                                                    registeredTaskParamList[
                                                        val
                                                    ] ?? {}
                                                ).map((key) => [key, '']),
                                                false
                                            );
                                            setFieldValue('task', val, true);
                                        }}
                                    />
                                </>
                            )}
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
                                <FormField stacked label="Schedule">
                                    <RecurrenceEditor
                                        recurrence={values.recurrence}
                                        recurrenceError={errors?.recurrence}
                                        setRecurrence={(val) =>
                                            setFieldValue('recurrence', val)
                                        }
                                        allowCron={true}
                                    />
                                </FormField>
                            ) : null}
                        </div>
                        <div className="TaskEditor-form-controls right-align mt16">
                            {task.id ? (
                                <Button
                                    disabled={!isValid}
                                    onClick={handleDeleteTask}
                                    title={'Delete Task'}
                                    color="cancel"
                                    icon="Trash"
                                />
                            ) : null}
                            <AsyncButton
                                icon="Save"
                                color="accent"
                                disabled={!isValid}
                                onClick={submitForm}
                                title={task.id ? 'Update Task' : 'Create Task'}
                            />
                        </div>
                    </Form>
                </FormWrapper>
            </div>
        );
    };

    return (
        <div className="TaskEditor">
            <Formik
                validateOnMount
                initialValues={formValues}
                validationSchema={taskFormSchema}
                onSubmit={handleTaskEditSubmit}
                enableReinitialize
            >
                {({ values, errors, setFieldValue, isValid, submitForm }) => (
                    <>
                        {task.id ? (
                            <>
                                <div className="TaskEditor-top horizontal-space-between mb24">
                                    <div className="TaskEditor-info">
                                        <Title size="xlarge" weight="bold">
                                            {values.name}
                                        </Title>
                                        <div className="mb16">
                                            {values.task}
                                        </div>
                                        <div>
                                            Last Run:{' '}
                                            <TimeFromNow
                                                timestamp={task.last_run_at}
                                            />
                                        </div>
                                        <div>
                                            Total Run Count:{' '}
                                            {task.total_run_count}
                                        </div>
                                    </div>
                                    <div className="TaskEditor-controls vertical-space-between">
                                        <AdminAuditLogButton
                                            itemType="task"
                                            itemId={task.id}
                                        />
                                        <div className="TaskEditor-run">
                                            <AsyncButton
                                                title="Run Task"
                                                icon="Play"
                                                onClick={runTask}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Tabs
                                    selectedTabKey={tab}
                                    items={[
                                        { name: 'Edit', key: 'edit' },
                                        { name: 'History', key: 'history' },
                                    ]}
                                    onSelect={(key: TaskEditorTabs) => {
                                        setTab(key);
                                    }}
                                />
                            </>
                        ) : null}
                        <div className="TaskEditor-content">
                            {tab === 'edit' ? (
                                getEditDOM(
                                    values,
                                    errors,
                                    setFieldValue,
                                    isValid,
                                    submitForm
                                )
                            ) : (
                                <div className="TaskEditor-history">
                                    <TaskStatus
                                        taskId={task.id}
                                        taskName={task.name}
                                        taskRunCount={task.total_run_count}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Formik>
        </div>
    );
};
