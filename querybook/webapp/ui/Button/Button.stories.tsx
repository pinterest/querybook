import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Button, ButtonProps } from './Button';
import { ButtonColors, ButtonThemes } from './ButtonTheme';

export default {
    title: 'Button/Button',
    decorators: [centered],
};

export const _Button = ({ ...args }: ButtonProps) => <Button {...args} />;
_Button.args = {
    icon: 'zap',
    title: 'Button',
    color: 'default',
    theme: 'outline',
    disabled: false,
    isLoading: false,

    pushable: false,
    size: 'medium',
    fullWidth: false,
    uppercase: false,
    attached: '',
    fontWeight: '',
    ping: '',
};

_Button.argTypes = {
    color: {
        control: {
            type: 'select',
            options: ButtonColors,
        },
    },
    theme: {
        control: {
            type: 'select',
            options: ButtonThemes,
        },
    },
    size: {
        control: {
            type: 'select',
            options: ['small', 'medium'],
        },
    },
    attached: {
        control: {
            type: 'select',
            options: ['', 'left', 'right'],
        },
    },
};

export const ButtonThemeColorExamples = () => (
    <>
        {ButtonThemes.map((theme) => (
            <div key={theme} className="mv12">
                {ButtonColors.map((color) => (
                    <Button key={theme + color} theme={theme} color={color}>
                        {theme} {color}
                    </Button>
                ))}
            </div>
        ))}
    </>
);

export const ButtonStylesExamples = () => (
    <>
        <div className="mb12">
            <Button pushable>Pushable Button</Button>
        </div>

        <div className="mb12">
            <Button disabled>Disabled Button</Button>
        </div>

        <div className="mb12">
            <Button fullWidth>Full Width Button</Button>
        </div>

        <div className="mb12">
            <Button uppercase>Uppercase Button</Button>
        </div>

        <div className="mb12">
            <Button attached="right">Button Attached Right</Button>
            <Button attached="left">Button Attached Left</Button>
        </div>

        <div className="mb12">
            <Button size="small">Small Button</Button>
        </div>
    </>
);
