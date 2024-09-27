import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { availableEnvironmentsSelector } from 'redux/environment/selector';
import { IEnvironment } from 'redux/environment/types';
import { makeSelectOptions, Select } from 'ui/Select/Select';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    defaultEnvironment: IEnvironment;
    onEnvironmentChange: (environment: IEnvironment) => void;
}

export const DataDocCloneButtonConfirm: React.FunctionComponent<IProps> = ({
    defaultEnvironment,
    onEnvironmentChange,
}) => {
    const availableEnvironments = useSelector(availableEnvironmentsSelector);

    const [selectedEnvironmentId, setSelectedEnvironmentId] =
        React.useState<number>(defaultEnvironment.id);

    const internalEnvironmentChange = useCallback(
        (event) => {
            if (event.target.value) {
                const environmentId = Number(event.target.value);
                onEnvironmentChange(
                    availableEnvironments.find(
                        (env) => env.id === environmentId
                    )
                );
                setSelectedEnvironmentId(environmentId);
            }
        },
        [availableEnvironments, onEnvironmentChange]
    );

    const selectOptionsDOM = React.useMemo(
        () =>
            makeSelectOptions(
                availableEnvironments.map((env) => ({
                    value: env.name,
                    key: env.id,
                }))
            ),
        [availableEnvironments]
    );

    return (
        <>
            <StyledText className="mb16">
                Select the environment to clone the DataDoc to:
            </StyledText>
            <Select
                value={selectedEnvironmentId}
                onChange={internalEnvironmentChange}
                className="mb16"
            >
                {selectOptionsDOM}
            </Select>
            <StyledText>
                You will be redirected to the new Data Doc after cloning.
            </StyledText>
        </>
    );
};
