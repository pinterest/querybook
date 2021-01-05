import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Button, ButtonTypes, IButtonProps } from './Button';

export default {
    title: 'Button/Button',
    decorators: [centered],
};

export const _Button = ({ ...args }: IButtonProps) => <Button {...args} />;
_Button.args = {
    icon: 'zap',
    title: 'Button',
    type: '',

    disabled: false,

    borderless: false,
    pushable: false,
    transparent: false,
    small: false,
    inverted: false,
    attachedRight: false,
    attachedLeft: false,
    isLoading: false,
    ping: '',
};

_Button.argTypes = {
    type: {
        control: {
            type: 'select',
            options: ButtonTypes,
        },
    },
};

export const ButtonTypesExamples = () => (
    <>
        <Button className="mb12" type="soft">
            Soft Button
        </Button>
        <Button className="mb12" type="inlineText">
            Inline-Text Button
        </Button>
        <Button className="mb12" type="confirm">
            Confirm Button
        </Button>
        <Button className="mb12" type="cancel">
            Cancel Button
        </Button>
    </>
);

export const ButtonStylesExamples = () => (
    <>
        <Button className="mb12" pushable>
            Pushable Button
        </Button>
        <Button className="mb12" borderless>
            Borderless Button
        </Button>
        <Button className="mb12" inverted>
            Inverted Button
        </Button>
        <div className="mb12">
            <Button attachedRight>Button Attached Right</Button>
            <Button attachedLeft>Button Attached Left</Button>
        </div>
        <Button small>Small Button</Button>
    </>
);
