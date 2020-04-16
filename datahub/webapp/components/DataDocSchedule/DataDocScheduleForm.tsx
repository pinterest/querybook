import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import { cronToRecurrence, recurrenceToCron } from 'lib/utils/cron';

import { Button } from 'ui/Button/Button';
import { CronField } from 'ui/FormikField/CronField';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { InfoButton } from 'ui/Button/InfoButton';
import { Title } from 'ui/Title/Title';
import { ToggleSwitchField } from 'ui/FormikField/ToggleSwitchField';

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
                                <CronField
                                    recurrence={values.recurrence}
                                    recurrenceError={errors?.recurrence}
                                    setRecurrence={setFieldValue}
                                />
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
