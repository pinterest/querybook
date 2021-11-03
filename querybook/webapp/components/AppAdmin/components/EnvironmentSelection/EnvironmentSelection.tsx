import React from 'react';
import { useField, useFormikContext } from 'formik';
import { SimpleField } from 'ui/FormikField/SimpleField';

type OptionsType = {
    value: string;
    key: string;
};

export const EnvironmentSelection = ({
    options = [],
    name,
    label,
}: {
    label: string;
    options: OptionsType[];
    name: string;
}) => {
    const [field, , helper] = useField({ name });
    const { values, setFieldValue } = useFormikContext<{
        setFieldValue: () => void;
        url_regex: string;
    }>();

    const value = options.find((o) => {
        const regexPattern = new RegExp(values.url_regex);
        return !!`/${o.value}/`.match(regexPattern);
    });

    return (
        <SimpleField
            type="select"
            {...field}
            label={label}
            value={value?.key}
            onChange={(selectedValue) => {
                helper.setValue(selectedValue);
                setFieldValue('url_regex', `/${selectedValue}/`);
            }}
            options={[
                {
                    value: '',
                    key: '',
                    hidden: true,
                },
                ...options,
            ]}
            help="You can specify the announcement for this announcement."
        />
    );
};
