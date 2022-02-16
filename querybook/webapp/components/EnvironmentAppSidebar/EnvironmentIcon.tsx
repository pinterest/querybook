import clsx from 'clsx';
import * as React from 'react';

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
            ? firstWordMatch[1].slice(0, 10).toLocaleUpperCase()
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
            <span className="env-icon-text">{envName}</span>
        </span>
    );
};
