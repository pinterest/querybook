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
    ...rest
}: {
    options: OptionsType[];
    name: string;
}) => {
    const [field, , helper] = useField({ name });
    const { values, setFieldValue } = useFormikContext<{
        setFieldValue: Function;
        values: Record<string, string>;
    }>();

    const value = options.find((o) => {
        const regexPattern = new RegExp(values.url_regex);
        return !!`/${o.value}/`.match(regexPattern);
    });

    return (
        <SimpleField
            type="select"
            {...field}
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
            {...rest}
        />
    );
};
