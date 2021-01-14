import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { CopyButton, ICopyButtonProps } from './CopyButton';

export const _CopyButton = (args: ICopyButtonProps) => <CopyButton {...args} />;
_CopyButton.args = {
    copyText: 'text to copy',
    title: 'Copy To Clipboard',
};

export default {
    title: 'Button/CopyButton',
    decorators: [centered],
};
