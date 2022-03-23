import React, { useMemo } from 'react';
import clsx from 'clsx';

import { useToggleState } from 'hooks/useToggleState';
import { DebouncedInput, IDebouncedInputProps } from './DebouncedInput';
import { IconButton } from 'ui/Button/IconButton';
import './DebouncedPasswordInput.scss';

export const DebouncedPasswordInput: React.FC<IDebouncedInputProps> = (
    props
) => {
    const [revealPassword, , toggleRevealPassword] = useToggleState(false);

    const className = useMemo(
        () =>
            clsx({
                [props.className]: props.className,
                DebouncedPasswordInput: true,
            }),
        [props.className]
    );

    const inputProps = useMemo(
        () => ({
            ...props.inputProps,
            type: revealPassword ? 'text' : 'password',
        }),
        [props.inputProps, revealPassword]
    );

    return (
        <DebouncedInput
            {...props}
            className={className}
            inputProps={inputProps}
        >
            <IconButton
                className="password-eye-icon"
                onClick={toggleRevealPassword}
                icon={revealPassword ? 'EyeOff' : 'Eye'}
                noPadding
            />
        </DebouncedInput>
    );
};
