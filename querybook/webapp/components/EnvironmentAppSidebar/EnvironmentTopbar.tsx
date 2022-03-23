import React from 'react';
import { useSelector } from 'react-redux';

import {
    currentEnvironmentSelector,
    userEnvironmentNamesSelector,
    orderedEnvironmentsSelector,
} from 'redux/environment/selector';
import { titleize } from 'lib/utils';

import { EnvironmentDropdownButton } from './EnvironmentDropdownButton';

import { Level } from 'ui/Level/Level';
import { Link } from 'ui/Link/Link';

import './EnvironmentTopbar.scss';
import { EnvironmentIcon } from './EnvironmentIcon';

const NUMBER_OF_ICONS_TO_SHOW = 5;

export const EnvironmentTopbar: React.FC = React.memo(() => {
    const environments = useSelector(orderedEnvironmentsSelector);
    const currentEnvironment = useSelector(currentEnvironmentSelector);
    const userEnvironmentNames = useSelector(userEnvironmentNamesSelector);

    if (!environments || environments.length < 2) {
        return null;
    }
    const environmentIcons = environments
        .slice(0, NUMBER_OF_ICONS_TO_SHOW)
        .map((environment) => {
            const selected = currentEnvironment
                ? currentEnvironment.id === environment.id
                : false;
            const accessible = userEnvironmentNames.has(environment.name);

            return (
                <Link
                    key={environment.id}
                    className="env-icon-wrapper"
                    aria-label={[
                        titleize(environment.name),
                        environment.description,
                    ]
                        .filter((s) => s)
                        .join('. ')}
                    data-balloon-pos={'down-left'}
                    data-balloon-length="medium"
                    to={accessible ? `/${environment.name}/` : null}
                >
                    <EnvironmentIcon
                        disabled={!accessible}
                        selected={selected}
                        environmentName={environment.name}
                    />
                </Link>
            );
        });

    return (
        <Level className="EnvironmentTopbar ">
            <div className="flex-row">{environmentIcons}</div>
            <div>
                <EnvironmentDropdownButton skip={NUMBER_OF_ICONS_TO_SHOW} />
            </div>
        </Level>
    );
});
