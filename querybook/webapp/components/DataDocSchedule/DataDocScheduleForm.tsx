import { FieldArray, Form, Formik, useFormikContext } from 'formik';
import React from 'react';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';

import type { IQueryResultExporter } from 'const/queryExecution';
import { IDataDocScheduleKwargs, NotifyOn } from 'const/schedule';
import { getExporterAuthentication } from 'lib/result-export';
import { getEnumEntries } from 'lib/typescript';
import {
    cronToRecurrence,
    IRecurrence,
    recurrenceOnYup,
    recurrenceToCron,
    recurrenceTypes,
} from 'lib/utils/cron';
import { queryCellSelector } from 'redux/dataDoc/selector';
import { notificationServiceSelector } from 'redux/notificationService/selector';
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
        notify_with: Yup.string().nullable(),
        notify_on: Yup.mixed().when('notify_with', {
            is: (val) => val != null,
            then: Yup.mixed().required(),
        }),
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
        notify_with: string | null;
        notify_on: NotifyOn;
        exports: IDataDocScheduleKwargs['exports'];
    };
}

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
                  notify_with: null,
                  notify_on: NotifyOn.ALL,
                  exports: [],
              },
          }
        : {
              recurrence,
              enabled,
              kwargs: {
                  notify_with: kwargs.notify_with,
                  notify_on: kwargs.notify_on,
                  exports: kwargs.exports,
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
                        <SimpleField
                            label="Notify With"
                            name="kwargs.notify_with"
                            type="react-select"
                            options={notifiers.map((notifier) => notifier.name)}
                            withDeselect
                        />
                        {values.kwargs.notify_with && (
                            <SimpleField
                                label="Notify On"
                                name="kwargs.notify_on"
                                type="react-select"
                                options={getEnumEntries(NotifyOn).map(
                                    ([key, value]) => ({
                                        value,
                                        label: key,
                                    })
                                )}
                            />
                        )}
                    </>
                );

                const exportField = (
                    <>
                        <FormSectionHeader>Export</FormSectionHeader>
                        <ScheduleExportsForm
                            docId={docId}
                            exporters={exporters}
                        />
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
