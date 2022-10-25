import { FieldArray, Form, Formik, useFormikContext } from 'formik';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as Yup from 'yup';

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
import { FormSectionHeader } from 'ui/Form/FormField';
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
                    to: Yup.array()
                        .of(Yup.string())
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
                  notifications: kwargs.notifications,
              },
          };

    return (
        <Formik
            validateOnMount
            initialValues={formValues}
            validationSchema={scheduleFormSchema}
            onSubmit={async (values) => {
                const cronRepr = recurrenceToCron(values.recurrence);

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

const NotifactionFormRow: React.FC<{
    name: string;
    index: number;
    removeRow: (index: number) => void;
    notificationRow: IDataDocScheduleNotification;
    notifierOptions: string[];
    notifyOnOptions: IOptions;
    getHelp: (notifierName: string) => string;
}> = ({
    name,
    index,
    notificationRow,
    removeRow,
    notifierOptions,
    notifyOnOptions,
    getHelp,
}) => {
    const { setFieldValue } = useFormikContext<IScheduleFormValues>();
    const notificationFormName = `${name}[${index}]`;
    const handleNotifyTo = (value) => {
        setFieldValue(
            `${notificationFormName}.config.to`,
            value
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
        );
    };
    const handleRemoveNotifier = useCallback(
        () => removeRow(index),
        [removeRow, index]
    );

    return (
        <div className="cell-export-field mb24 flex-row">
            <div className="flex1 mr16">
                <div className="horizontal-space-between">
                    <WrappedFormField
                        label="Notify With"
                        name={`${notificationFormName}.with`}
                        type="react-select"
                        options={notifierOptions}
                        withDeselect
                    />

                    <WrappedFormField
                        label="Notify On"
                        name={`${notificationFormName}.on`}
                        type="react-select"
                        isDisabled={!notificationRow.with}
                        options={notifyOnOptions}
                    />
                </div>

                <SimpleField
                    label="Notify To"
                    name={`${notificationFormName}.config.to`}
                    type="input"
                    help={getHelp(notificationRow.with)}
                    onChange={handleNotifyTo}
                    value={notificationRow.config.to.join(', ')}
                    inputProps={{
                        placeholder: getHelp(notificationRow.with),
                    }}
                />
            </div>
            <div>
                <IconButton icon="X" onClick={handleRemoveNotifier} />
            </div>
        </div>
    );
};

const ScheduleNotifactionsForm: React.FC<{
    notifiers: INotifier[];
}> = ({ notifiers }) => {
    const name = 'kwargs.notifications';
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

    const getNotifierHelp = (notifierName: string) =>
        notifiers.find((n) => n.name === notifierName)?.help ||
        'Add comma(,) separated recepients here';

    return (
        <FieldArray
            name={name}
            render={(arrayHelpers) => {
                const notificationFields = notificationValues.map(
                    (_, index) => (
                        <NotifactionFormRow
                            key={index}
                            name={name}
                            index={index}
                            removeRow={arrayHelpers.remove}
                            notificationRow={notificationValues[index]}
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
                                onClick={() => {
                                    console.log(notifierOptions);
                                    console.log(notifyOnOptions);
                                    arrayHelpers.push({
                                        with: notifierOptions[0] ?? null,
                                        on: notifyOnOptions[0]?.value ?? null,
                                        config: {
                                            to: [],
                                        },
                                    });
                                }}
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
