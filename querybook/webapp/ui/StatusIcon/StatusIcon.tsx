import clsx from 'clsx';
import React from 'react';

import { Status } from 'const/queryStatus';
import { Icon } from 'ui/Icon/Icon';

import './StatusIcon.scss';

export interface IStatusIconProps {
    status: Status;
    tooltip?: string;
    hollow?: boolean;
}

export const StatusIcon: React.FunctionComponent<IStatusIconProps> = ({
    status,
    tooltip,
    hollow,
}) => {
    const spanProps = {
        className: clsx({
            StatusIcon: true,
            [status]: true,
            'flex-center': true,
        }),
    };
    if (tooltip) {
        spanProps['aria-label'] = tooltip;
        spanProps['data-balloon-pos'] = 'up';
    }

    return (
        <span {...spanProps}>
            <Icon className={status} name="Circle" size={16} fill={!hollow} />
        </span>
    );
};

StatusIcon.defaultProps = {
    status: Status.none,
};
