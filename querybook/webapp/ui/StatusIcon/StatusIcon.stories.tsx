import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Status } from 'const/queryStatus';

import { IStatusIconProps, StatusIcon } from './StatusIcon';

export const _StatusIcon = (args: IStatusIconProps) => (
    <div className="flex-column">
        <div>
            <StatusIcon {...args} status={Status.success} /> Success
        </div>
        <div>
            <StatusIcon {...args} status={Status.warning} /> Warning
        </div>
        <div>
            <StatusIcon {...args} status={Status.error} /> Error
        </div>
        <div>
            <StatusIcon {...args} status={Status.running} /> Running
        </div>
        <div>
            <StatusIcon {...args} status={Status.none} /> None
        </div>
    </div>
);

_StatusIcon.args = {
    tooltip: 'Some tooltip',
    hollow: false,
};

export default {
    title: 'Stateless/StatusIcon',
    decorators: [centered],
};
