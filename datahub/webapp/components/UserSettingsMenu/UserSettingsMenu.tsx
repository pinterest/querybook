import React from 'react';
import { IStoreState } from 'redux/store/types';
import { useSelector, useDispatch } from 'react-redux';
import { titleize } from 'lib/utils';

import { queryEngineSelector } from 'redux/queryEngine/selector';
import * as userActions from 'redux/user/action';

import { Select, makeSelectOptions } from 'ui/Select/Select';
import './UserSettingsMenu.scss';
import { availableEnvironmentsSelector } from 'redux/environment/selector';

const userSettingConfig: Record<
    string,
    {
        options: Array<
            | string
            | {
                  value: string;
                  key: string;
              }
        >;
        default: string;
        helper: string;
        per_env?: boolean;
    }
> = require('config/user_setting.yaml');

export const UserSettingsMenu: React.FunctionComponent<{}> = () => {
    const userSettingByKey = useSelector(
        (state: IStoreState) => state.user.rawSettings
    );
    const currentEnvId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const availableEnvironments = useSelector(availableEnvironmentsSelector);
    const queryEngines = useSelector(queryEngineSelector);

    const dispatch = useDispatch();
    const setUserSettings = React.useCallback(
        (key: string, value: string) =>
            dispatch(userActions.setUserSettings(key, value)),
        []
    );

    const getRawKey = React.useCallback(
        (key: string) => {
            if (userSettingConfig[key].per_env) {
                return `${key}|${currentEnvId}`;
            }
            return key;
        },
        [currentEnvId]
    );

    const getOptionsByKey = React.useCallback(
        (key: string) => {
            if (key === 'default_query_engine') {
                return makeSelectOptions(
                    queryEngines.map((queryEngine) => ({
                        value: queryEngine.name,
                        key: queryEngine.id,
                    }))
                );
            } else if (key === 'default_environment') {
                return makeSelectOptions(
                    availableEnvironments.map((env) => ({
                        value: env.name,
                        key: env.id,
                    }))
                );
            }
            return makeSelectOptions(userSettingConfig[key].options);
        },
        [queryEngines]
    );

    const handleSettingsChange = React.useCallback(
        (key: string, evt) => {
            const rawKey = getRawKey(key);
            const oldValue = userSettingByKey[rawKey];
            const value = evt.target.value;

            if (value !== oldValue) {
                setUserSettings(rawKey, value);
            }
        },
        [userSettingByKey, setUserSettings, getRawKey]
    );

    const makeFieldByKey = (key: string) => {
        const value = userSettingByKey[getRawKey(key)];
        const formField = (
            <>
                <div className="UserSettingsMenu-setting">
                    {titleize(key.split('_').join(' '))}
                </div>
                <Select
                    onChange={handleSettingsChange.bind(this, key)}
                    value={value}
                >
                    {getOptionsByKey(key)}
                </Select>
                <div className="UserSettingsMenu-desc">
                    {userSettingConfig[key].helper}
                </div>
            </>
        );

        return formField;
    };

    const fieldsDOM = Object.keys(userSettingConfig).map((key) => (
        <div className="flex-row" key={key}>
            {makeFieldByKey(key)}
        </div>
    ));

    return <div className="UserSettingsMenu">{fieldsDOM}</div>;
};
