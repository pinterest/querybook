import React from 'react';
import { useField } from 'formik';
import { ToggleSwitch, IToggleSwitchProps } from 'ui/ToggleSwitch/ToggleSwitch';

export interface IToggleSwitchFieldProps extends Partial<IToggleSwitchProps> {
    name: string;
}

export const ToggleSwitchField: React.FC<IToggleSwitchFieldProps> = ({
    name,
    ...toggleProps
}) => {
    const [_, meta, helpers] = useField(name);
    return (
        <ToggleSwitch
            checked={toggleProps.checked ?? meta.value}
            onChange={
                toggleProps.onChange ??
                ((value) => {
                    helpers.setValue(value);
                    helpers.setTouched(true);
                })
            }
        />
    );
};
