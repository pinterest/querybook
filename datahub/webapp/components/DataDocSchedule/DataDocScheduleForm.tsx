import React from 'react';
import moment from 'moment';
import { Formik, Field, Form } from 'formik';
import Select from 'react-select';
import * as Yup from 'yup';

import {
    cronToRecurrence,
    recurrenceToCron,
    getMonthdayOptions,
    getWeekdayOptions,
    getRecurrenceLocalTimeString,
} from 'lib/utils/cron';
import { makeReactSelectStyle } from 'lib/utils/react-select';

import { Button } from 'ui/Button/Button';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimePicker } from 'ui/TimePicker/TimePicker';
import { InfoButton } from 'ui/Button/InfoButton';
import { Title } from 'ui/Title/Title';
import { FormField } from 'ui/Form/FormField';
import { ToggleSwitchField } from 'ui/FormikField/ToggleSwitchField';
import { FormWrapper } from 'ui/Form/FormWrapper';

const recurrenceReactSelectStyle = makeReactSelectStyle(true);

interface IDataDocScheduleFormProps {
    cron?: string;
    enabled?: boolean;

    onCreate: (cron: string) => void;
    onUpdate: (cron: string, enabled: boolean) => void;
    onDelete?: () => void;
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
});

export const DataDocScheduleForm: React.FunctionComponent<IDataDocScheduleFormProps> = ({
    cron,
    enabled,

    onCreate,
    onUpdate,
    onDelete,
}) => {
    const isCreateForm = !Boolean(cron);
    const recurrence = cronToRecurrence(cron || '0 0 * * *');
    const formValues = isCreateForm
        ? {
              recurrence,
          }
        : {
              recurrence,
              enabled,
          };

    return (
        <Formik
            isInitialValid={true}
            initialValues={formValues}
            validationSchema={scheduleFormSchema}
            onSubmit={(values) => {
                const cronRepr = recurrenceToCron(values.recurrence);
                if (isCreateForm) {
                    onCreate(cronRepr);
                } else {
                    onUpdate(cronRepr, values.enabled);
                }
            }}
        >
            {({ handleSubmit, values, errors, setFieldValue, isValid }) => {
                const formTitle = isCreateForm
                    ? 'Add new schedule'
                    : 'Edit schedule';
                const hourSecondField = (
                    <FormField
                        label="Hour/Minute (UTC)"
                        error={errors?.recurrence?.hour}
                    >
                        <div className="flex-row">
                            <TimePicker
                                allowEmpty={false}
                                value={moment()
                                    .hour(values.recurrence.hour)
                                    .minute(values.recurrence.minute)}
                                minuteStep={15}
                                showSecond={false}
                                format="H:mm"
                                onChange={(value) => {
                                    setFieldValue(
                                        'recurrence.hour',
                                        value.hour()
                                    );
                                    setFieldValue(
                                        'recurrence.minute',
                                        value.minute()
                                    );
                                }}
                            />
                            <div>
                                &nbsp; Local:
                                {getRecurrenceLocalTimeString(
                                    values.recurrence
                                )}
                            </div>
                        </div>
                    </FormField>
                );
                const recurrenceTypeField = (
                    <FormField label="Recurrence Type">
                        <Field name="recurrence.recurrence">
                            {({ field }) => (
                                <Tabs
                                    items={['daily', 'weekly', 'monthly']}
                                    selectedTabKey={field.value}
                                    onSelect={(key) => {
                                        if (field.value !== key) {
                                            setFieldValue('recurrence.on', []);
                                        }
                                        setFieldValue(
                                            'recurrence.recurrence',
                                            key
                                        );
                                    }}
                                    pills
                                />
                            )}
                        </Field>
                    </FormField>
                );

                let datePickerField;
                if (values.recurrence.recurrence !== 'daily') {
                    const options =
                        values.recurrence.recurrence === 'weekly'
                            ? getWeekdayOptions()
                            : getMonthdayOptions();
                    datePickerField = (
                        <FormField label="Run on the follow days">
                            <Field
                                name="recurrence.on"
                                render={({ field }) => (
                                    <Select
                                        menuPortalTarget={document.body}
                                        styles={recurrenceReactSelectStyle}
                                        value={options.filter((option) =>
                                            field.value.includes(option.value)
                                        )}
                                        options={options}
                                        onChange={(value) =>
                                            setFieldValue(
                                                'recurrence.on',
                                                (value as Array<{
                                                    value: any;
                                                }>).map((v) => v.value)
                                            )
                                        }
                                        isMulti
                                    />
                                )}
                            />
                        </FormField>
                    );
                }

                const enabledField = isCreateForm ? null : (
                    <FormField label="Enabled">
                        <ToggleSwitchField name="enabled" />
                    </FormField>
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
                                {hourSecondField}
                                {recurrenceTypeField}
                                {datePickerField}
                                {enabledField}
                                <br />
                                <div className="flex-right">
                                    {onDelete && (
                                        <Button
                                            title="Delete"
                                            type="cancel"
                                            onClick={onDelete}
                                        />
                                    )}
                                    <Button
                                        disabled={!isValid}
                                        onClick={() => handleSubmit()}
                                        title={
                                            isCreateForm ? 'Create' : 'Update'
                                        }
                                    />
                                </div>
                            </Form>
                        </FormWrapper>
                    </div>
                );
            }}
        </Formik>
    );
};
