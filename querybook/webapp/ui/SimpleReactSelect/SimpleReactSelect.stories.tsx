import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { SimpleReactSelect } from './SimpleReactSelect';

export const _SimpleReactSelect = (args) => {
    const [value, setValue] = React.useState(1);

    return (
        <div style={{ width: '160px', alignItems: 'stretch' }}>
            <SimpleReactSelect
                {...args}
                value={value}
                onChange={setValue}
                options={[
                    { label: 'option one', value: 1 },
                    { label: 'option two', value: 2 },
                ]}
            />
        </div>
    );
};

_SimpleReactSelect.args = {
    withDeselect: false,
    isDisabled: false,
    clearAfterSelect: false,
};

export default {
    title: 'Form/SimpleReactSelect',
    decorators: [centered],
};
