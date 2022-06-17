import clsx from 'clsx';
import * as React from 'react';

import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    selected: boolean;
    disabled: boolean;
    environmentName: string;
}

export const EnvironmentIcon: React.FunctionComponent<IProps> = ({
    selected,
    disabled,
    environmentName,
}) => {
    const envName = React.useMemo(() => {
        const firstWordMatch = environmentName.match(/([a-zA-Z0-9]+)/);
        return firstWordMatch
            ? firstWordMatch[1].slice(0, 9).toLocaleUpperCase()
            : '';
    }, [environmentName]);

    return (
        <span
            className={clsx({
                'env-icon': true,
                disabled,
                selected,
            })}
        >
            <AccentText className="env-icon-text" weight="bold">
                {envName}
            </AccentText>
        </span>
    );
};
