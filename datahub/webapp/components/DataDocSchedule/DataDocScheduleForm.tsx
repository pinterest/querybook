import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useSelector } from 'react-redux';

import { IDataDocScheduleKwargs, NotifyOn } from 'const/schedule';
import { cronToRecurrence, recurrenceToCron } from 'lib/utils/cron';
import { getExporterAuthentication } from 'lib/result-export';

import { IStoreState } from 'redux/store/types';
import { queryCellSelector } from 'redux/dataDoc/selector';

import { RecurrenceEditor } from 'ui/ReccurenceEditor/RecurrenceEditor';
import { FormSectionHeader } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { InfoButton } from 'ui/Button/InfoButton';
import { Level } from 'ui/Level/Level';
import { Title } from 'ui/Title/Title';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { DisabledSection } from 'ui/DisabledSection/DisabledSection';
import {
    SmartForm,
    updateValue,
    getDefaultFormValue,
} from 'ui/SmartForm/SmartForm';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

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
    enabled: Yup.boolean().notRequired(),
    kwargs: Yup.object().shape({
        notify_with: Yup.string().nullable(),
        notify_on: Yup.mixed().when('notify_with', {
            is: (val) => val != null,
            then: Yup.mixed().required(),
        }),
        exporter_cell_id: Yup.number().nullable(),
        exporter_name: Yup.string()
            .nullable()
            .when('exporter_cell_id', {
                is: (val) => val != null,
                then: Yup.string().required(),
            }),
        exporter_params: Yup.object(),
    }),
});

export const DataDocScheduleForm: React.FunctionComponent<IDataDocScheduleFormProps> = ({
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
    const queryCellOptions = useSelector((state: IStoreState) =>
        queryCellSelector(state, { docId })
    );
    const exporters = useSelector(
        (state: IStoreState) => state.queryExecutions.statementExporters
    );

    const isCreateForm = !Boolean(cron);
    const recurrence = cronToRecurrence(cron || '0 0 * * *');
    const formValues = isCreateForm
        ? {
              recurrence,
              kwargs: {
                  notify_with: null,
                  notify_on: NotifyOn.ALL,
                  exporter_cell_id: null,
                  exporter_name: null,
                  exporter_params: {},
              },
          }
        : {
              recurrence,
              enabled,
              kwargs: {
                  notify_with: kwargs.notify_with,
                  notify_on: kwargs.notify_on,
                  exporter_cell_id: kwargs.exporter_cell_id,
                  exporter_name: kwargs.exporter_name,
                  exporter_params: kwargs.exporter_params,
              },
          };

    return (
        <Formik
            validateOnMount
            initialValues={formValues}
            validationSchema={scheduleFormSchema}
            onSubmit={async (values) => {
                const cronRepr = recurrenceToCron(values.recurrence);
                const exporter =
                    values.kwargs.exporter_cell_id != null
                        ? exporters.find(
                              (exp) => exp.name === values.kwargs.exporter_name
                          )
                        : null;
                if (exporter) {
                    await getExporterAuthentication(exporter);
                }

                if (isCreateForm) {
                    await onCreate(cronRepr, values.kwargs);
                } else {
                    await onUpdate(cronRepr, enabled, values.kwargs);
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
                const formTitle = isCreateForm
                    ? 'Add new schedule'
                    : 'Edit schedule';

                const enabledField = !isCreateForm && (
                    <SimpleField label="Enabled" name="enabled" type="toggle" />
                );

                const notificationField = (
                    <>
                        <FormSectionHeader>Notification</FormSectionHeader>
                        <SimpleField
                            label="Notify With"
                            name="kwargs.notify_with"
                            type="select"
                            options={['email', 'slack']}
                            withDeselect
                        />
                        {values.kwargs.notify_with && (
                            <SimpleField
                                label="Notify On"
                                name="kwargs.notify_on"
                                type="react-select"
                                options={Object.entries(NotifyOn)
                                    .filter(
                                        ([key, _]) =>
                                            !isNaN(Number(NotifyOn[key]))
                                    )
                                    .map(([key, value]) => ({
                                        value,
                                        label: key,
                                    }))}
                            />
                        )}
                    </>
                );

                const exporter = exporters.find(
                    (exp) => exp.name === values.kwargs.exporter_name
                );
                const exportField = (
                    <>
                        <FormSectionHeader>Export Results</FormSectionHeader>
                        <SimpleField
                            label="Export Cell"
                            name="kwargs.exporter_cell_id"
                            type="react-select"
                            options={queryCellOptions.map((val) => ({
                                value: val.id,
                                label: val.title,
                            }))}
                            withDeselect
                        />
                        {values.kwargs.exporter_cell_id != null && (
                            <SimpleField
                                label="Export with"
                                name="kwargs.exporter_name"
                                type="react-select"
                                options={exporters.map((exp) => ({
                                    value: exp.name,
                                    label: exp.name,
                                }))}
                                onChange={(v) => {
                                    setFieldValue('kwargs.exporter_name', v);
                                    setFieldValue(
                                        'kwargs.exporter_params',
                                        exporter?.form
                                            ? getDefaultFormValue(exporter.form)
                                            : {}
                                    );
                                }}
                            />
                        )}
                        {values.kwargs.exporter_cell_id != null &&
                            exporter?.form && (
                                <>
                                    <FormSectionHeader>
                                        Export Parameters
                                    </FormSectionHeader>
                                    <SmartForm
                                        formField={exporter.form}
                                        value={values.kwargs.exporter_params}
                                        onChange={(path, value) =>
                                            setFieldValue(
                                                'kwargs.exporter_params',
                                                updateValue(
                                                    values.kwargs
                                                        .exporter_params,
                                                    path,
                                                    value,
                                                    [undefined, '']
                                                )
                                            )
                                        }
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
                                    type="cancel"
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
                        <div className="horizontal-space-between">
                            <div>
                                <Title size={4}>{formTitle}</Title>
                            </div>
                            <div>
                                <InfoButton>
                                    Schedule your doc to be ran on a certain
                                    interval. Query cells will be executed one
                                    by one.
                                </InfoButton>
                            </div>
                        </div>
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
