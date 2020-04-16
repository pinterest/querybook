import * as React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import { cronToRecurrence, recurrenceToCron } from 'lib/utils/cron';

import { Button } from 'ui/Button/Button';
import { CronField } from 'ui/FormikField/CronField';
import { FormField } from 'ui/Form/FormField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { ToggleSwitchField } from 'ui/FormikField/ToggleSwitchField';

import './TaskEdit.scss';

interface IProps {
    taskId: number;
    cron: string;
    enabled: boolean;
    taskOptions: any;
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

export const TaskEdit: React.FunctionComponent<IProps> = ({
    taskId,
    cron,
    enabled,
    taskOptions,
}) => {
    const recurrence = cronToRecurrence(cron || '0 0 * * *');
    const formValues = {
        recurrence,
        enabled,
        taskOptions,
    };

    const handleTaskEditSubmit = (editedValues) => {
        const editedCron = recurrenceToCron(editedValues.recurrence);
        console.log('update task schedule');
    };

    return (
        <Formik
            isInitialValid={true}
            initialValues={formValues}
            validationSchema={taskFormSchema}
            onSubmit={(values) => {
                handleTaskEditSubmit(values);
            }}
        >
            {({ handleSubmit, values, errors, setFieldValue, isValid }) => {
                return (
                    <div className="DataDocScheduleForm">
                        <FormWrapper minLabelWidth="180px" size={7}>
                            <Form>
                                <CronField
                                    recurrence={values.recurrence}
                                    recurrenceError={errors?.recurrence}
                                    setRecurrence={setFieldValue}
                                />
                                <FormField label="Enabled">
                                    <ToggleSwitchField name="enabled" />
                                </FormField>
                                <br />
                                <div className="flex-right">
                                    {/* {onDelete && (
                                        <Button
                                            title="Delete"
                                            type="cancel"
                                            onClick={onDelete}
                                        />
                                    )} */}
                                    <Button
                                        disabled={!isValid}
                                        onClick={() => handleSubmit()}
                                        title="Update"
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
