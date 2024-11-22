import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserSettingsTab } from 'components/EnvironmentAppRouter/modalRoute/UserSettingsMenuRoute';
import userSettingConfig from 'config/user_setting.yaml';
import {
    getTableSamplingRateOptions,
    isAIFeatureEnabled,
    TABLE_SAMPLING_CONFIG,
} from 'lib/public-config';
import { titleize } from 'lib/utils';
import { availableEnvironmentsSelector } from 'redux/environment/selector';
import { notificationServiceSelector } from 'redux/notificationService/selector';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';
import * as userActions from 'redux/user/action';
import { makeSelectOptions, Select } from 'ui/Select/Select';

import './UserSettingsMenu.scss';

export const UserSettingsMenu: React.FC<{ tab: UserSettingsTab }> = ({
    tab,
}) => {
    const userSettingByKey = useSelector(
        (state: IStoreState) => state.user.rawSettings
    );
    const currentEnvId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const availableEnvironments = useSelector(availableEnvironmentsSelector);
    const queryEngines = useSelector(queryEngineSelector);
    const notifiers = useSelector(notificationServiceSelector);

    const dispatch = useDispatch();
    const setUserSettings = React.useCallback(
        (key: string, value: string) =>
            dispatch(userActions.setUserSettings(key, value)),
        []
    );

    const settingsToShow = useMemo(
        () =>
            Object.entries(userSettingConfig).filter(([key, value]) => {
                if (key === 'sql_complete') {
                    return (
                        isAIFeatureEnabled('sql_complete') && value.tab === tab
                    );
                }
                return value.tab === tab;
            }),
        [tab]
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
            } else if (key === 'notification_preference') {
                return makeSelectOptions(
                    notifiers.map((notifier) => notifier.name)
                );
            } else if (key === 'table_sample_rate') {
                const options = getTableSamplingRateOptions();
                return makeSelectOptions(options);
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

    const getValueByKey = (key: string) => {
        let defaultValue = userSettingConfig[key].default;

        if (key === 'table_sample_rate') {
            defaultValue = TABLE_SAMPLING_CONFIG.default_sample_rate.toString();
        }

        return userSettingByKey[getRawKey(key)] ?? defaultValue;
    };

    const makeFieldByKey = (key: string) => {
        const value = getValueByKey(key);

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

    const fieldsDOM = settingsToShow.map(([key]) => (
        <div className="flex-row" key={key}>
            {makeFieldByKey(key)}
        </div>
    ));

    return <div className="UserSettingsMenu">{fieldsDOM}</div>;
};
