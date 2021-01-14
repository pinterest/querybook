import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Select, ISelectProps, makeSelectOptions } from './Select';

export const _Select = (args: ISelectProps) => {
    const [value, setValue] = React.useState('1');

    const onChange = (newVal) => {
        setValue(newVal.target.value);
    };

    return (
        <Select {...args} value={value} onChange={onChange}>
            {makeSelectOptions([
                { value: 'option one', key: '1' },
                { value: 'option two', key: '2' },
            ])}
        </Select>
    );
};

_Select.args = {
    fullWidth: false,
    transparent: false,

    withDeselect: false,
    disabled: false,
};

export default {
    title: 'Form/Select',
    decorators: [centered],
};
