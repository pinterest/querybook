import * as React from 'react';
import { Field } from 'formik';
import moment from 'moment';
import Select from 'react-select';

import {
    getRecurrenceLocalTimeString,
    getWeekdayOptions,
    getMonthdayOptions,
    IRecurrence,
} from 'lib/utils/cron';
import { makeReactSelectStyle } from 'lib/utils/react-select';

import { FormField } from 'ui/Form/FormField';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimePicker } from 'ui/TimePicker/TimePicker';

const recurrenceReactSelectStyle = makeReactSelectStyle(true);

interface IProps {
    recurrence: IRecurrence;
    recurrenceError?: any;
    setRecurrence: (name: string, val: any) => void;
}

export const CronField: React.FunctionComponent<IProps> = ({
    recurrence,
    recurrenceError,
    setRecurrence,
}) => {
    const hourSecondField = (
        <FormField label="Hour/Minute (UTC)" error={recurrenceError?.hour}>
            <div className="flex-row">
                <TimePicker
                    allowEmpty={false}
                    value={moment()
                        .hour(recurrence.hour)
                        .minute(recurrence.minute)}
                    minuteStep={15}
                    showSecond={false}
                    format="H:mm"
                    onChange={(value) => {
                        setRecurrence('recurrence.hour', value.hour());
                        setRecurrence('recurrence.minute', value.minute());
                    }}
                />
                <div>
                    &nbsp; Local:
                    {getRecurrenceLocalTimeString(recurrence)}
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
                                setRecurrence('recurrence.on', []);
                            }
                            setRecurrence('recurrence.recurrence', key);
                        }}
                        pills
                    />
                )}
            </Field>
        </FormField>
    );

    let datePickerField;
    if (recurrence.recurrence !== 'daily') {
        const options =
            recurrence.recurrence === 'weekly'
                ? getWeekdayOptions()
                : getMonthdayOptions();
        datePickerField = (
            <FormField label="Recurrence Days">
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
                                setRecurrence(
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
    return (
        <div className="CronField">
            {hourSecondField}
            {recurrenceTypeField}
            {datePickerField}
        </div>
    );
};
