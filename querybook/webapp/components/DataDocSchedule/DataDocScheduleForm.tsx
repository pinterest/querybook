import { FieldArray, Form, Formik, useField, useFormikContext } from 'formik';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';

import { MultiCreatableUserSelect } from 'components/UserSelect/MultiCreatableUserSelect';
import type { IQueryResultExporter } from 'const/queryExecution';
import {
    IDataDocScheduleKwargs,
    IDataDocScheduleNotification,
    NotifyOn,
} from 'const/schedule';
import { getExporterAuthentication } from 'lib/result-export';
import { getEnumEntries } from 'lib/typescript';
import {
    cronToRecurrence,
    IRecurrence,
    recurrenceOnYup,
    recurrenceToCron,
    recurrenceTypes,
} from 'lib/utils/cron';
import { IOptions } from 'lib/utils/react-select';
import { queryCellSelector } from 'redux/dataDoc/selector';
import { notificationServiceSelector } from 'redux/notificationService/selector';
import { INotifier } from 'redux/notificationService/types';
import { IStoreState } from 'redux/store/types';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { DisabledSection } from 'ui/DisabledSection/DisabledSection';
import { FormField, FormSectionHeader } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { Level } from 'ui/Level/Level';
import { RecurrenceEditor } from 'ui/ReccurenceEditor/RecurrenceEditor';
import {
    getDefaultFormValue,
    SmartForm,
    updateValue,
} from 'ui/SmartForm/SmartForm';

interface IDataDocScheduleFormProps {
    isEditable: boolean;
    docId: number;
    cron?: string;
    enabled?: boolean;
    kwargs: IDataDocScheduleKwargs;

    onCreate: (cron: string, kwargs: IDataDocScheduleKwargs) => Promise<any>;
    onUpdate: (
        cron: string,
        enabled: boolean,
        kwargs: IDataDocScheduleKwargs
    ) => Promise<any>;
    onDelete?: () => Promise<void>;
    onRun?: () => Promise<void>;
}

const scheduleFormSchema = Yup.object().shape({
    recurrence: Yup.object().shape({
        hour: Yup.number().min(0).max(23),
        minute: Yup.number().min(0).max(59),
        recurrence: Yup.string().oneOf(recurrenceTypes),
        on: recurrenceOnYup,
    }),
    enabled: Yup.boolean().notRequired(),
    kwargs: Yup.object().shape({
        notifications: Yup.array().of(
            Yup.object().shape({
                with: Yup.string().nullable(),
                on: Yup.string().required(),
                config: Yup.object().shape({
                    to_all: Yup.array()
                        .of(Yup.object())
                        .required()
                        .min(1, 'Must have at least one recipient'),
                }),
            })
        ),
        exports: Yup.array().of(
            Yup.object().shape({
                exporter_cell_id: Yup.number().required(),
                exporter_name: Yup.string().required(),
                exporter_params: Yup.object(),
            })
        ),
    }),
});

function getDistinctExporters(
    values: IScheduleFormValues,
    exporters: IQueryResultExporter[]
) {
    return [
        ...new Set(
            values.kwargs.exports.map((exportConf) => exportConf.exporter_name)
        ),
    ]
        .map((exporterName) =>
            exporters.find((exp) => exp.name === exporterName)
        )
        .filter((exporter) => exporter);
}

interface IScheduleFormValues {
    recurrence: IRecurrence;
    enabled?: boolean;
    kwargs: {
        notifications: IDataDocScheduleNotification[];
        exports: IDataDocScheduleKwargs['exports'];
    };
}

const WrappedFormField = styled(SimpleField)`
    width: 40%;
`;

export const DataDocScheduleForm: React.FunctionComponent<
    IDataDocScheduleFormProps
> = ({
    isEditable,

    docId,
    cron,
    enabled,
    kwargs,

    onCreate,
    onUpdate,
    onDelete,
    onRun,
}) => {
    const exporters = useSelector(
        (state: IStoreState) => state.queryExecutions.statementExporters
    );
    const notifiers = useSelector(notificationServiceSelector);
    const isCreateForm = !Boolean(cron);
    const recurrence = cronToRecurrence(cron || '0 0 * * *');
    const formValues: IScheduleFormValues = isCreateForm
        ? {
              recurrence,
              kwargs: {
                  exports: [],
                  notifications: [],
              },
          }
        : {
              recurrence,
              enabled,
              kwargs: {
                  exports: kwargs.exports,
                  // merge notification config from `config.to_user` and `config.to` to `config.to_all`
                  notifications: kwargs.notifications.map((n) => ({
                      ...n,
                      config: {
                          ...n.config,
                          to_all: [
                              ...(n.config.to_user ?? []).map((to) => ({
                                  value: to,
                                  isUser: true,
                              })),
                              ...(n.config.to ?? []).map((to) => ({
                                  value: to,
                              })),
                          ],
                      },
                  })),
              },
          };

    return (
        <Formik
            validateOnMount
            initialValues={formValues}
            validationSchema={scheduleFormSchema}
            onSubmit={async (values) => {
                const cronRepr = recurrenceToCron(values.recurrence);

                // convert notifications back from `to_all` to `to` and `to_user` and remove the `to_all` field
                values.kwargs.notifications = (
                    values.kwargs.notifications ?? []
                ).map((n) => ({
                    ...n,
                    config: {
                        to_user: n.config['to_all']
                            .filter((v) => v.isUser)
                            .map((v) => v.value),
                        to: n.config['to_all']
                            .filter((v) => !v.isUser)
                            .map((v) => v.value),
                    },
                }));

                const exportersInWorkflow = getDistinctExporters(
                    values,
                    exporters
                );
                for (const exporter of exportersInWorkflow) {
                    await getExporterAuthentication(exporter);
                }

                if (isCreateForm) {
                    await onCreate(cronRepr, values.kwargs);
                } else {
                    await onUpdate(cronRepr, values.enabled, values.kwargs);
                }
            }}
        >
            {({
                submitForm,
                values,
                errors,
                setFieldValue,
                isValid,
                dirty,
            }) => {
                const enabledField = !isCreateForm && (
                    <SimpleField label="Enabled" name="enabled" type="toggle" />
                );

                const notificationField = (
                    <>
                        <FormSectionHeader>Notification</FormSectionHeader>
                        <ScheduleNotifactionsForm notifiers={notifiers} />
                    </>
                );

                const exportField = (
                    <>
                        {exporters && exporters.length > 0 && (
                            <>
                                <FormSectionHeader>Export</FormSectionHeader>
                                <ScheduleExportsForm
                                    docId={docId}
                                    exporters={exporters}
                                />
                            </>
                        )}
                    </>
                );

                const controlDOM = isEditable && (
                    <Level>
                        <div>
                            {onRun && (
                                <AsyncButton
                                    disabled={dirty}
                                    title="Manual Run"
                                    onClick={onRun}
                                />
                            )}
                        </div>
                        <div>
                            {onDelete && (
                                <AsyncButton
                                    title="Delete"
                                    color="cancel"
                                    onClick={onDelete}
                                />
                            )}
                            <AsyncButton
                                disabled={!isValid || (!dirty && !isCreateForm)}
                                onClick={submitForm}
                                title={isCreateForm ? 'Create' : 'Update'}
                            />
                        </div>
                    </Level>
                );

                return (
                    <div className="DataDocScheduleForm">
                        <FormWrapper minLabelWidth="180px" size={7}>
                            <Form>
                                <DisabledSection disabled={!isEditable}>
                                    <RecurrenceEditor
                                        recurrence={values.recurrence}
                                        recurrenceError={errors?.recurrence}
                                        allowCron={false}
                                        setRecurrence={(val) =>
                                            setFieldValue('recurrence', val)
                                        }
                                    />
                                    {enabledField}
                                    {notificationField}
                                    {exportField}

                                    <br />
                                    {controlDOM}
                                </DisabledSection>
                            </Form>
                        </FormWrapper>
                    </div>
                );
            }}
        </Formik>
    );
};

const NotificationFormRow: React.FC<{
    name: string;
    onRemove: () => void;
    notifierOptions: string[];
    notifyOnOptions: IOptions;
    getHelp: (notifierName: string) => string;
}> = ({ name, onRemove, notifierOptions, notifyOnOptions, getHelp }) => {
    const [{ value: notification }, ,] = useField(name);
    const [, notifyToAllMeta, notifyToAllHelpers] = useField(
        `${name}.config.to_all`
    );

    return (
        <div className="cell-export-field mb24 flex-row">
            <div className="flex1 mr16">
                <div className="horizontal-space-between">
                    <WrappedFormField
                        label="Notify With"
                        name={`${name}.with`}
                        type="react-select"
                        options={notifierOptions}
                        withDeselect
                    />

                    <WrappedFormField
                        label="Notify On"
                        name={`${name}.on`}
                        type="react-select"
                        isDisabled={!notification.with}
                        options={notifyOnOptions}
                    />
                </div>

                <FormField
                    label="Notify To"
                    help={getHelp(notification.with)}
                    error={
                        notifyToAllMeta.touched ? notifyToAllMeta.error : null
                    }
                >
                    <MultiCreatableUserSelect
                        value={
                            notifyToAllMeta.value ??
                            notifyToAllMeta.initialValue
                        }
                        onChange={notifyToAllHelpers.setValue}
                        selectProps={{
                            isClearable: true,
                            placeholder: getHelp(notification.with),
                            onBlur: () => notifyToAllHelpers.setTouched(true),
                        }}
                    />
                </FormField>
            </div>
            <div>
                <IconButton icon="X" onClick={onRemove} />
            </div>
        </div>
    );
};

const NotifactionsFormName = 'kwargs.notifications';
const ScheduleNotifactionsForm: React.FC<{
    notifiers: INotifier[];
}> = ({ notifiers }) => {
    const { values } = useFormikContext<IScheduleFormValues>();

    const notificationValues = values.kwargs.notifications ?? [];

    const notifierOptions = useMemo(
        () => notifiers.map((notifier) => notifier.name),
        [notifiers]
    );

    const notifyOnOptions = useMemo(
        () =>
            getEnumEntries(NotifyOn).map(([key, value]) => ({
                value,
                label: key,
            })),
        []
    );

    const getNotifierHelp = useCallback(
        (notifierName: string) =>
            notifiers.find((n) => n.name === notifierName)?.help ||
            'Add comma(,) separated recepients here',
        [notifiers]
    );

    const handleNewNotification = useCallback(
        (arrayHelpers) => {
            arrayHelpers.push({
                with: notifierOptions[0],
                on: notifyOnOptions[0]?.value,
                config: {
                    to_all: [],
                },
            });
        },
        [notifierOptions, notifyOnOptions]
    );

    return (
        <FieldArray
            name={NotifactionsFormName}
            render={(arrayHelpers) => {
                const notificationFields = notificationValues.map(
                    (_, index) => (
                        <NotificationFormRow
                            key={index}
                            name={`${NotifactionsFormName}[${index}]`}
                            onRemove={() => arrayHelpers.remove(index)}
                            notifierOptions={notifierOptions}
                            notifyOnOptions={notifyOnOptions}
                            getHelp={getNotifierHelp}
                        />
                    )
                );

                return (
                    <>
                        {notificationFields}
                        <div className="center-align mt8">
                            <SoftButton
                                icon="Plus"
                                title="New Notification"
                                onClick={() =>
                                    handleNewNotification(arrayHelpers)
                                }
                            />
                        </div>
                    </>
                );
            }}
        />
    );
};

const ScheduleExportsForm: React.FC<{
    docId: number;
    exporters: IQueryResultExporter[];
}> = ({ docId, exporters }) => {
    const name = 'kwargs.exports';
    const { values, setFieldValue } = useFormikContext<IScheduleFormValues>();
    const queryCellOptions = useSelector((state: IStoreState) =>
        queryCellSelector(state, docId)
    );
    const exportsValues = values.kwargs.exports ?? [];

    return (
        <FieldArray
            name={name}
            render={(arrayHelpers) => {
                const exportFields = exportsValues.map((exportConf, index) => {
                    const exportFormName = `${name}[${index}]`;

                    const cellPickerField = (
                        <SimpleField
                            label="Export Cell"
                            name={`${exportFormName}.exporter_cell_id`}
                            type="react-select"
                            options={queryCellOptions.map((val) => ({
                                value: val.id,
                                label: val.title,
                            }))}
                            withDeselect
                        />
                    );

                    const exporter = exporters.find(
                        (exp) => exp.name === exportConf.exporter_name
                    );
                    const exporterPickerField = (
                        <SimpleField
                            label="Export with"
                            name={`${exportFormName}.exporter_name`}
                            type="react-select"
                            options={exporters.map((exp) => exp.name)}
                            onChange={(v) => {
                                setFieldValue(
                                    `${exportFormName}.exporter_name`,
                                    v
                                );
                                setFieldValue(
                                    `${exportFormName}.exporter_params`,
                                    exporter?.form
                                        ? getDefaultFormValue(exporter.form)
                                        : {}
                                );
                            }}
                        />
                    );
                    const exporterFormField = exporter?.form && (
                        <>
                            <FormSectionHeader>
                                Export Parameters
                            </FormSectionHeader>
                            <SmartForm
                                formField={exporter.form}
                                value={
                                    values.kwargs.exports[index].exporter_params
                                }
                                onChange={(path, value) =>
                                    setFieldValue(
                                        `${exportFormName}.exporter_params`,
                                        updateValue(
                                            values.kwargs.exports[index]
                                                .exporter_params,
                                            path,
                                            value,
                                            [undefined, '']
                                        )
                                    )
                                }
                            />
                        </>
                    );

                    return (
                        <div
                            key={index}
                            className="cell-export-field mb24 flex-row"
                        >
                            <div className="flex1 mr16">
                                {cellPickerField}
                                {exporterPickerField}
                                {exporterFormField}
                            </div>
                            <div>
                                <IconButton
                                    icon="X"
                                    onClick={() => arrayHelpers.remove(index)}
                                />
                            </div>
                        </div>
                    );
                });

                const controlDOM = (
                    <div className="center-align mt8">
                        <SoftButton
                            icon="Plus"
                            title="New Query Cell Result Export"
                            onClick={() =>
                                arrayHelpers.push({
                                    exporter_cell_id: null,
                                    exporter_name: null,
                                    exporter_params: {},
                                })
                            }
                        />
                    </div>
                );
                return (
                    <div className="ScheduleExportsForm">
                        {exportFields}
                        {controlDOM}
                    </div>
                );
            }}
        />
    );
};
