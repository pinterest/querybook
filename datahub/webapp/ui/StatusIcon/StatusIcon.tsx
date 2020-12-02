import React from 'react';
import classNames from 'classnames';

import { Status } from 'const/queryStatus';

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
    const iconProps = {
        status,
        className: classNames({
            fas: !hollow,
            far: hollow,
            'fa-circle': true,
        }),
    };

    const spanProps = {
        className: classNames({
            StatusIcon: true,
            [status]: true,
        }),
    };
    if (tooltip) {
        spanProps['aria-label'] = tooltip;
        spanProps['data-balloon-pos'] = 'up';
    }

    return (
        <span {...spanProps}>
            <i {...iconProps} />
        </span>
    );
};

StatusIcon.defaultProps = {
    status: Status.none,
};
