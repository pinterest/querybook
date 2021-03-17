import React from 'react';
import clsx from 'clsx';
import { useSelector } from 'react-redux';

import { TooltipDirection } from 'const/tooltip';
import history from 'lib/router-history';
import {
    environmentsSelector,
    currentEnvironmentSelector,
    userEnvironmentNamesSelector,
} from 'redux/environment/selector';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';

import './EnvironmentDropdownButton.scss';

export const EnvironmentDropdownButton: React.FunctionComponent<{
    skip?: number;
}> = ({ skip = 0 }) => {
    const environments = useSelector(environmentsSelector);
    const currentEnvironment = useSelector(currentEnvironmentSelector);
    const userEnvironmentNames = useSelector(userEnvironmentNamesSelector);

    const environmentsToShow = environments.slice(skip);
    if (!environmentsToShow.length) {
        return null;
    }

    const environmentItems = environmentsToShow.map((environment) => {
        const accessible = userEnvironmentNames.has(environment.name);

        return {
            name: (
                <span
                    className={clsx({
                        'environment-name': true,
                        'environment-disabled': !accessible,
                    })}
                >
                    {environment.name}
                </span>
            ),
            onClick: accessible
                ? () => history.push(`/${environment.name}/`)
                : null,
            checked: environment === currentEnvironment,
            tooltip: environment.description,
            tooltipPos: 'right' as TooltipDirection,
        };
    });

    return (
        <Dropdown className="EnvironmentDropdownButton">
            <ListMenu items={environmentItems} type="select" />
        </Dropdown>
    );
};
